import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ExcelJS from 'exceljs';
import { Store } from "../src/db.ts";
import { createApp } from "../src/app.ts";
import { defaultRules, scoreEvaluation, rankingRows } from "../src/domain.ts";

test("pontuação dinâmica, justificativas, pesos e elogios", () => {
  const rules = structuredClone(defaultRules);
  rules.criteria[0].weight = 2;
  rules.complimentPoints = 20;
  const answers = rules.criteria.map((c) => ({
    criterionId: c.id,
    value: 5,
    comment: "",
  }));
  assert.equal(scoreEvaluation(rules, answers, "Excelente", false).score, 160);
  assert.equal(scoreEvaluation(rules, answers, "Excelente", true).score, 180);
  assert.throws(() =>
    scoreEvaluation(rules, [...answers.slice(1), answers[1]], "", false),
  );
  assert.throws(() =>
    scoreEvaluation(
      rules,
      answers.map((a) => ({ ...a, value: 1 })),
      "",
      false,
    ),
  );
  assert.throws(() =>
    scoreEvaluation(
      rules,
      answers.map((a) => ({ ...a, value: 999 })),
      "",
      false,
    ),
  );
});
test("fluxo completo: autenticação, vínculos, regras congeladas, duplicidade, importação, ranking e persistência", async () => {
  const dir = await mkdtemp(join(tmpdir(), "clube-test-"));
  const file = join(dir, "test.sqlite");
  const db = await new Store().init(undefined, file);
  const server = createApp(db).listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address() as { port: number };
  const url = `http://127.0.0.1:${address.port}`;
  let adminCookie = "";
  async function request(path: string, body?: unknown, cookie = adminCookie) {
    const res = await fetch(url + "/api" + path, {
      method: body === undefined ? "GET" : "POST",
      headers: { "content-type": "application/json", cookie },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json = await res.json();
    return {
      status: res.status,
      data: json,
      cookie: res.headers.get("set-cookie")?.split(";")[0] || cookie,
    };
  }
  async function ok(path: string, body?: unknown, cookie = adminCookie) {
    const r = await request(path, body, cookie);
    assert.ok(r.status < 300, `${path}: ${JSON.stringify(r)}`);
    return r.data;
  }
  try {
    assert.equal((await request("/state")).status, 401);
    const setup = await request("/auth/setup", {
      company: "Empresa de teste",
      name: "Administrador",
      email: "admin@example.test",
      password: "TestPassword123!",
      demo: true,
    });
    assert.equal(setup.status, 201);
    adminCookie = setup.cookie;
    assert.equal(
      (await request("/auth/setup", { company: "Outra" })).status,
      409,
    );
    let state = await ok("/state");
    assert.equal(state.employees.length, 6);
    assert.equal(state.user.passwordHash, undefined);
    assert.equal(state.users[0].passwordHash, undefined);
    const post = state.posts[0];
    const employee = state.employees[0];
    const clientRole = state.roles.find((r: any) => r.name === "Cliente");
    const otherClient = await ok("/records/clients", {
      name: "Cliente B",
      status: "ativo",
    });
    const otherPost = await ok("/records/posts", {
      name: "Porto B",
      clientId: otherClient.id,
      status: "ativo",
    });
    const reviewer = await ok("/records/users", {
      name: "Cliente A",
      email: "reviewer@example.test",
      password: "TestPassword123!",
      roleId: clientRole.id,
      clientIds: [],
      postIds: [post.id],
      status: "ativo",
    });
    const outsider = await ok("/records/users", {
      name: "Cliente B",
      email: "outsider@example.test",
      password: "TestPassword123!",
      roleId: clientRole.id,
      clientIds: [otherClient.id],
      postIds: [],
      status: "ativo",
    });
    const login = await request("/auth/login", {
      email: reviewer.email,
      password: "TestPassword123!",
    });
    const reviewCookie = login.cookie;
    const outside = await request("/auth/login", {
      email: outsider.email,
      password: "TestPassword123!",
    });
    const outsideCookie = outside.cookie;
    assert.equal(
      (
        await request(
          "/records/clients",
          { name: "Não permitido" },
          reviewCookie,
        )
      ).status,
      403,
    );
    assert.equal(
      (await ok("/state", undefined, outsideCookie)).employees.length,
      0,
    );
    const current = new Date().toISOString().slice(0, 10);
    const rules = structuredClone(defaultRules);
    rules.provisional = false;
    rules.minimumCycles = 1;
    rules.complimentPoints = 20;
    rules.scale.at(-1)!.points = 30;
    await ok("/settings", rules);
    const season = await ok("/records/seasons", {
      name: "Temporada 1",
      start: current,
      end: current,
      publishDate: current,
    });
    const cycle = await ok("/records/cycles", {
      name: "Ciclo 1",
      seasonId: season.id,
      start: current,
      end: current,
      deadline: current,
    });
    await ok(`/seasons/${season.id}/activate`, {});
    await ok(`/cycles/${cycle.id}/activate`, {});
    state = await ok("/state");
    const p = state.participants.find((p: any) => p.employeeId === employee.id);
    const answers = rules.criteria.map((c) => ({
      criterionId: c.id,
      value: 5,
      comment: "",
    }));
    assert.equal(
      (
        await request(
          "/evaluations",
          { participantId: p.id, answers },
          outsideCookie,
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await request(
          "/evaluations",
          {
            participantId: p.id,
            answers: answers.map((a) => ({ ...a, value: 1 })),
          },
          reviewCookie,
        )
      ).status,
      400,
    );
    await ok(
      "/evaluations",
      { participantId: p.id, answers: [answers[0]], status: "rascunho" },
      reviewCookie,
    );
    const [first, second] = await Promise.all([
      request(
        "/evaluations",
        { participantId: p.id, answers, compliment: "Muito bom atendimento" },
        reviewCookie,
      ),
      request("/evaluations", { participantId: p.id, answers }, reviewCookie),
    ]);
    assert.deepEqual([first.status, second.status].sort(), [200, 409]);
    const evaluation = first.status === 200 ? first.data : second.data;
    assert.equal(evaluation.score, 90);
    await ok(`/evaluations/${evaluation.id}/approve`, {});
    state = await ok("/state");
    assert.equal(
      state.evaluations.find((e: any) => e.id === evaluation.id).score,
      110,
    );
    const changed = structuredClone(rules);
    changed.scale.at(-1)!.points = 999;
    await ok("/settings", changed);
    assert.equal((await ok("/state")).seasons[0].rules.scale.at(-1).points, 30);
    await ok("/records/allocations", {
      employeeId: employee.id,
      postId: otherPost.id,
      start: current,
      supervisorId: "",
    });
    state = await ok("/state");
    assert.equal(state.evaluations[0].snapshot.clientId, post.clientId);
    assert.equal(
      state.allocations.filter((a: any) => a.employeeId === employee.id).length,
      2,
    );
    assert.equal(
      (await ok("/state", undefined, outsideCookie)).evaluations.length,
      0,
    );
    assert.deepEqual(
      (await ok("/state", undefined, reviewCookie)).rankings,
      {},
    );
    await ok(`/cycles/${cycle.id}/close`, {});
    await ok(`/seasons/${season.id}/close`, {});
    await ok(`/seasons/${season.id}/publish`, {});
    state = await ok("/state");
    assert.equal(state.rankings[season.id][0].score, 110);
    assert.equal(state.rankings[season.id][0].badge, "ouro");
    assert.equal(
      (
        await request(`/evaluations/${evaluation.id}/cancel`, {
          reason: "teste",
        })
      ).status,
      400,
    );
    const csv =
      "matricula;nome;funcao;cliente;posto\nIMP1;Pessoa Importada;Vigilante;Novo Cliente;Portaria\n";
    const preview = await ok("/imports/preview", {
      name: "base.csv",
      content: Buffer.from(csv).toString("base64"),
    });
    assert.equal(preview.records, 1);
    assert.equal(preview.errors, 0);
    await ok(`/imports/${preview.id}/confirm`, {});
    assert.equal(
      (await request(`/imports/${preview.id}/confirm`, {})).status,
      409,
    );
    const bad = await ok("/imports/preview", {
      name: "erros.csv",
      content: Buffer.from(
        csv + "IMP1;Duplicado;Vigilante;Novo Cliente;Portaria\n",
      ).toString("base64"),
    });
    assert.equal(bad.errors, 1);
    assert.equal((await request(`/imports/${bad.id}/confirm`, {})).status, 400);
    const workbook=new ExcelJS.Workbook();const sheet=workbook.addWorksheet('Base');sheet.addRows([['matricula','nome','funcao','cliente','posto'],['XLS1','Pessoa Excel','Vigilante','Cliente Excel','Posto Excel']]);
    const xlsx=await ok('/imports/preview',{name:'base.xlsx',content:Buffer.from(await workbook.xlsx.writeBuffer()).toString('base64')});assert.equal(xlsx.records,1);assert.equal(xlsx.errors,0);
    const exportRes = await fetch(url + "/api/export/ranking", {
      headers: { cookie: adminCookie },
    });
    assert.equal(exportRes.status, 200);
    const bytes = new Uint8Array(await exportRes.arrayBuffer());
    assert.equal(String.fromCharCode(...bytes.slice(0, 2)), "PK");
    const foreign = await fetch(url + "/api/settings", {
      method: "POST",
      headers: {
        cookie: adminCookie,
        origin: "https://malicious.example",
        "content-type": "application/json",
      },
      body: JSON.stringify(rules),
    });
    assert.equal(foreign.status, 403);
    await ok("/auth/logout", {}, reviewCookie);
    assert.equal(
      (await request("/state", undefined, reviewCookie)).status,
      401,
    );
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await db.close();
  }
  const reopened = await new Store().init(undefined, file);
  assert.equal((await reopened.all("employees")).length, 7);
  assert.equal((await reopened.all("seasons"))[0].result[0].score, 110);
  await reopened.close();
  await rm(dir, { recursive: true, force: true });
});
test("média de ciclos e elegibilidade não favorecem quantidade de avaliações", () => {
  const rules = { ...defaultRules, minimumCycles: 2 };
  const season = { id: "s", rules };
  const cycles = [
    { id: "c1", seasonId: "s" },
    { id: "c2", seasonId: "s" },
  ];
  const ps = [
    { id: "p1", cycleId: "c1", employeeId: "e", snapshot: { name: "Pessoa" } },
    { id: "p2", cycleId: "c2", employeeId: "e", snapshot: { name: "Pessoa" } },
  ];
  const es = [
    {
      id: "1",
      participantId: "p1",
      status: "enviada",
      score: 100,
      roleId: "r",
      answers: [],
      sentAt: "2026-01-01",
    },
    {
      id: "2",
      participantId: "p1",
      status: "enviada",
      score: 100,
      roleId: "r",
      answers: [],
      sentAt: "2026-01-02",
    },
    {
      id: "3",
      participantId: "p2",
      status: "enviada",
      score: 60,
      roleId: "r",
      answers: [],
      sentAt: "2026-03-01",
    },
  ];
  const result = rankingRows(season, cycles, ps, es);
  assert.equal(result[0].score, 80);
  assert.equal(result[0].badge, "prata");
  assert.equal(
    rankingRows(season, cycles, ps, es.slice(0, 2))[0].eligible,
    false,
  );
});
