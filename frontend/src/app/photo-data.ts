import { useMemo } from "react";
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

  return useMemo(() => {
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

    const roleProfile = String(data.role?.name || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    const isClient = roleProfile === "cliente";
    const isSupervisor = ["supervisor", "fiscal"].includes(roleProfile);
    const todayStr = new Date().toISOString().slice(0, 10);

    const sortedCycles = [...cycles].sort((a, b) =>
      String(a.start).localeCompare(String(b.start)),
    );

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
              item.status !== "rascunho" &&
              item.status !== "pulado",
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
        const skippedEval = data.evaluations.find(
          (item) =>
            item.participantId === participant.id &&
            item.evaluatorId === data.user.id &&
            item.status === "pulado",
        );

        const windowStart = isClient && participantCycle?.clientStart
          ? participantCycle.clientStart
          : isSupervisor && participantCycle?.supervisorStart
            ? participantCycle.supervisorStart
            : participantCycle?.start || "";

        const windowEnd = isClient && participantCycle?.clientDeadline
          ? participantCycle.clientDeadline
          : isSupervisor && participantCycle?.supervisorDeadline
            ? participantCycle.supervisorDeadline
            : participantCycle?.deadline || "";

        const notStartedYet = Boolean(windowStart && todayStr < windowStart);
        const isExpired = Boolean(windowEnd && todayStr > windowEnd);
        const windowOpen = !notStartedYet && !isExpired;
        const windowStatus = notStartedYet ? "upcoming" : isExpired ? "expired" : "available";

        const deadline = windowEnd || participantCycle?.deadline || "";
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
          status: skippedEval
            ? "pulado"
            : notStartedYet
            ? "aguardando_periodo"
            : days < 0
            ? "atrasado"
            : draft
            ? "iniciada"
            : "pendente",
          deadline: dateLabel(deadline),
          deadlineRaw: deadline,
          daysLeft: days < 0 ? `${Math.abs(days)} dias de atraso` : `${days} dias`,
          windowOpen,
          windowStatus,
          windowStart,
          windowEnd,
          windowStartLabel: windowStart ? dateLabel(windowStart) : "",
          windowEndLabel: windowEnd ? dateLabel(windowEnd) : "",
          isSkipped: Boolean(skippedEval),
          skipReason: skippedEval?.reason || "",
        };
      });

    // Universo completo de colaboradores a avaliar para o avaliador no ciclo atual/ativo
    const toEvaluate: any[] = data.participants
      .filter((participant) => {
        const participantCycle = data.cycles.find(
          (item) => item.id === participant.cycleId,
        );
        // Exibir participantes elegíveis do ciclo ativo (ou mais recente)
        const isCurrentCycle = cycle ? participant.cycleId === cycle.id : participantCycle?.status === "ativo";
        return participant.eligible !== false && isCurrentCycle;
      })
      .map((participant) => {
        const participantCycle = data.cycles.find(
          (item) => item.id === participant.cycleId,
        );
        const emp = data.employees.find((e) => e.id === participant.employeeId);

        // Verificar se este avaliador já concluiu a avaliação
        const submittedEval = data.evaluations.find(
          (item) =>
            item.participantId === participant.id &&
            item.evaluatorId === data.user.id &&
            !item.replicated &&
            item.status === "enviada",
        );
        const isEvaluated = Boolean(submittedEval);

        const skippedEval = data.evaluations.find(
          (item) =>
            item.participantId === participant.id &&
            item.evaluatorId === data.user.id &&
            item.status === "pulado",
        );

        // Períodos específicos
        const windowStart = isClient && participantCycle?.clientStart
          ? participantCycle.clientStart
          : isSupervisor && participantCycle?.supervisorStart
            ? participantCycle.supervisorStart
            : participantCycle?.start || "";

        const windowEnd = isClient && participantCycle?.clientDeadline
          ? participantCycle.clientDeadline
          : isSupervisor && participantCycle?.supervisorDeadline
            ? participantCycle.supervisorDeadline
            : participantCycle?.deadline || "";

        const notStartedYet = Boolean(windowStart && todayStr < windowStart);
        const isExpired = Boolean(windowEnd && todayStr > windowEnd);
        const windowOpen = !notStartedYet && !isExpired;
        const windowStatus = notStartedYet ? "upcoming" : isExpired ? "expired" : "available";

        // Próximo ciclo para informar data em caso de já avaliado
        const currentCycleIdx = sortedCycles.findIndex((c) => c.id === participant.cycleId);
        const nextCycle = currentCycleIdx >= 0 && currentCycleIdx < sortedCycles.length - 1
          ? sortedCycles[currentCycleIdx + 1]
          : null;

        const nextCycleStartDate = nextCycle
          ? (isClient && nextCycle.clientStart ? nextCycle.clientStart : isSupervisor && nextCycle.supervisorStart ? nextCycle.supervisorStart : nextCycle.start)
          : "";
        const nextCycleStartLabel = nextCycleStartDate ? dateLabel(nextCycleStartDate) : "";

        // Mensagem de período
        let availabilityMessage = "";
        if (isEvaluated) {
          availabilityMessage = nextCycleStartLabel
            ? `Avaliação concluída neste ciclo. Próxima avaliação disponível a partir de ${nextCycleStartLabel} (próximo ciclo).`
            : `Avaliação concluída neste ciclo. Temporada encerrada ou sem novo ciclo cadastrado.`;
        } else if (notStartedYet) {
          availabilityMessage = `Você poderá avaliar este colaborador a partir de ${dateLabel(windowStart)}.`;
        } else if (isExpired) {
          availabilityMessage = `O período de avaliação para o seu perfil encerrou em ${dateLabel(windowEnd)}.`;
        } else {
          availabilityMessage = `Período de avaliação aberto até ${dateLabel(windowEnd)}.`;
        }

        const canEvaluate = windowOpen && !isEvaluated;
        const isGray = !canEvaluate; // Fica em cinza se fora do período ou já avaliado

        return {
          id: participant.id,
          participantId: participant.id,
          cycleId: participant.cycleId,
          cycleName: participantCycle?.name || "Ciclo",
          name: participant.snapshot?.name || emp?.name || "—",
          photo: participant.snapshot?.photo || emp?.photo || "",
          role: participant.snapshot?.role || emp?.role || "Colaborador",
          client: participant.snapshot?.client || "—",
          post: participant.snapshot?.post || "—",
          registration: participant.snapshot?.registration || emp?.registration || "—",
          supervisor:
            usersById.get(participant.snapshot?.supervisorId)?.name || "—",
          score: Number(submittedEval?.score || 0),
          badge: null,
          status: "ativo",
          evaluations: isEvaluated ? 1 : 0,
          avgScore: Number(submittedEval?.score || 0),
          presence: 0,
          admissionDate: emp?.admissionDate || "",
          allocationStart: participant.snapshot?.allocationStart || "",
          gender: emp?.gender || "",
          cpf: emp?.cpf || "",
          windowOpen,
          windowStatus,
          windowStart,
          windowEnd,
          windowStartLabel: windowStart ? dateLabel(windowStart) : "",
          windowEndLabel: windowEnd ? dateLabel(windowEnd) : "",
          isSkipped: Boolean(skippedEval),
          skipReason: skippedEval?.reason || "",
          isEvaluated,
          canEvaluate,
          isGray,
          availabilityMessage,
          nextCycleStartLabel,
          submittedEvalId: submittedEval?.id,
        };
      })
      .sort((a, b) => {
        // Ordenação inteligente:
        // 1º Colaboradores aptos a avaliar agora
        // 2º Colaboradores pulados
        // 3º Colaboradores aguardando período (em cinza)
        // 4º Colaboradores já avaliados (em cinza)
        const getPriority = (item: any) => {
          if (item.canEvaluate && !item.isSkipped) return 1;
          if (item.canEvaluate && item.isSkipped) return 2;
          if (!item.isEvaluated && !item.windowOpen) return 3;
          if (item.isEvaluated) return 4;
          return 5;
        };
        const pA = getPriority(a);
        const pB = getPriority(b);
        if (pA !== pB) return pA - pB;
        return String(a.name).localeCompare(String(b.name));
      });

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
  }, [data, context]);
}
