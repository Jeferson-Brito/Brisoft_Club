import { dateLabel, useData, type Row } from "./state";

const LOADED_AT = Date.now();

const currentAllocation = (employeeId: string, allocations: Row[]) =>
  allocations.find((item) => item.employeeId === employeeId && !item.end) ||
  allocations
    .filter((item) => item.employeeId === employeeId)
    .sort((a, b) => String(b.start).localeCompare(String(a.start)))[0];

export function usePhotoData() {
  const context = useData();
  const { data } = context;
    const season =
      data.seasons.find((item) => item.status === "ativa") ||
      [...data.seasons].sort((a, b) =>
        String(b.start).localeCompare(String(a.start)),
      )[0];
    const cycles = data.cycles.filter((item) => item.seasonId === season?.id);
    const cycle =
      cycles.find((item) => item.status === "ativo") ||
      [...cycles].sort((a, b) =>
        String(b.start).localeCompare(String(a.start)),
      )[0];
    const ranking = (season && data.rankings[season.id]) || [];
    const rankingByEmployee = new Map(
      ranking.map((item) => [item.employeeId || item.id, item]),
    );
    const roleName = (roleId: string) =>
      data.roles.find((item) => item.id === roleId)?.name || "—";
    const usersById = new Map(data.users.map((item) => [item.id, item]));

    const employees: any[] = data.employees.map((employee) => {
      const allocation = currentAllocation(employee.id, data.allocations);
      const post = data.posts.find((item) => item.id === allocation?.postId);
      const client = data.clients.find(
        (item) => item.id === (allocation?.clientId || post?.clientId),
      );
      const rank = rankingByEmployee.get(employee.id);
      const employeeEvaluations = data.evaluations.filter(
        (item) =>
          item.snapshot?.registration === employee.registration &&
          item.status === "enviada",
      );
      const notes = employeeEvaluations.flatMap((item) =>
        (item.answers || []).map((answer: Row) => Number(answer.value || 0)),
      );
      return {
        ...employee,
        client: client?.name || "Sem cliente",
        clientId: client?.id || "",
        post: post?.name || "Sem posto",
        postId: post?.id || "",
        supervisorId: allocation?.supervisorId || "",
        allocationStart: allocation?.start || "",
        supervisor: usersById.get(allocation?.supervisorId)?.name || "—",
        score: Number(rank?.score || 0),
        badge: rank?.badge || null,
        evaluations: employeeEvaluations.length,
        avgScore: notes.length
          ? notes.reduce((sum, note) => sum + note, 0) / notes.length
          : 0,
        presence: rank?.eligible ? 100 : 0,
      };
    });

    const clients: any[] = data.clients.map((client) => {
      const posts = data.posts.filter((item) => item.clientIds?.includes(client.id));
      const employeeRows = employees.filter((item) => item.clientId === client.id);
      const scored = employeeRows.filter((item) => item.score > 0);
      return {
        ...client,
        posts: posts.length,
        employees: employeeRows.length,
        avgScore: scored.length
          ? scored.reduce((sum, item) => sum + item.score, 0) / scored.length
          : 0,
        address: posts[0]?.address || "—",
        since: client.createdAt
          ? new Date(client.createdAt).getFullYear().toString()
          : "—",
      };
    });

    const evaluations: any[] = data.evaluations.map((item, index) => {
      const evaluationSeason = data.seasons.find(
        (candidate) => candidate.id === item.seasonId,
      );
      const instant = item.sentAt || item.createdAt;
      const score = Number(item.score || 0);
      return {
        ...item,
        id: item.id || index + 1,
        date: dateLabel(instant),
        time: instant
          ? new Date(instant).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—",
        employee: item.snapshot?.name || "—",
        photo: item.snapshot?.photo || "",
        role: item.snapshot?.role || "—",
        registration: item.snapshot?.registration || "—",
        client: item.snapshot?.client || "—",
        clientId: item.snapshot?.clientId || "",
        post: item.snapshot?.post || "—",
        evaluator: item.evaluator || "—",
        evaluatorRole: item.evaluatorRole || roleName(item.roleId),
        scores: (item.answers || []).map((answer: Row) =>
          Number(answer.value || 0),
        ),
        score,
        badge: evaluationSeason?.rules
          ? score >= evaluationSeason.rules.gold
            ? "ouro"
            : score >= evaluationSeason.rules.silver
              ? "prata"
              : score >= evaluationSeason.rules.bronze
                ? "bronze"
                : null
          : null,
        hasCompliment: Boolean(item.compliment),
      };
    });

    const pending: any[] = data.participants
      .filter((participant) => {
        const participantCycle = data.cycles.find(
          (item) => item.id === participant.cycleId,
        );
        return (
          participant.eligible !== false &&
          participantCycle?.status === "ativo" &&
          !data.evaluations.some(
            (item) =>
              item.participantId === participant.id &&
              item.evaluatorId === data.user.id &&
              !item.replicated &&
              item.status !== "rascunho",
          )
        );
      })
      .map((participant) => {
        const participantCycle = data.cycles.find(
          (item) => item.id === participant.cycleId,
        );
        const draft = data.evaluations.find(
          (item) =>
            item.participantId === participant.id &&
            item.evaluatorId === data.user.id &&
            item.status === "rascunho",
        );
        const deadline = participantCycle?.deadline || "";
        const days = deadline
          ? Math.ceil(
              (new Date(`${deadline}T12:00:00`).getTime() - LOADED_AT) /
                86400000,
            )
          : 0;
        return {
          ...participant,
          employee: participant.snapshot?.name || "—",
          photo: participant.snapshot?.photo || "",
          registration: participant.snapshot?.registration || "—",
          role: participant.snapshot?.role || "—",
          client: participant.snapshot?.client || "—",
          post: participant.snapshot?.post || "—",
          evaluator: data.user.name,
          evaluatorRole: data.role.name,
          status: days < 0 ? "atrasado" : draft ? "iniciada" : "pendente",
          deadline: dateLabel(deadline),
          deadlineRaw: deadline,
          daysLeft: days < 0 ? `${Math.abs(days)} dias de atraso` : `${days} dias`,
        };
      });

    const toEvaluate: any[] = pending.map((item) => ({
      id: item.id,
      participantId: item.id,
      cycleId: item.cycleId,
      name: item.employee,
      photo: item.photo,
      role: item.role,
      client: item.client,
      post: item.post,
      registration: item.registration,
      supervisor:
        usersById.get(item.snapshot?.supervisorId)?.name || "—",
      score: 0,
      badge: null,
      status: "ativo",
      evaluations: 0,
      avgScore: 0,
      presence: 0,
      admissionDate: "",
    }));

    return {
      ...context,
      season,
      cycle,
      cycles,
      ranking,
      employees,
      clients,
      evaluations,
      pending,
      toEvaluate,
    };
}
