import { useState, useRef, useEffect } from 'react';
import { Download, Filter, Search, Trophy, X, Crown, Calendar, ChevronRight } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { usePhotoData } from '../../app/photo-data';

const selectCls = 'w-full min-h-9 text-sm font-medium border border-slate-200 rounded-lg px-3 bg-white text-slate-700 outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer';

function ConfettiEffect() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.offsetWidth || window.innerWidth);
    let height = (canvas.height = canvas.offsetHeight || 380);

    const colors = ['#f59e0b', '#fbbf24', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#ef4444', '#f1f5f9', '#6366f1'];
    const count = 65;
    const pieces = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: -20 - Math.random() * 120,
      sizeW: 6 + Math.random() * 6,
      sizeH: 3 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedY: 1.5 + Math.random() * 2.8,
      speedX: (Math.random() - 0.5) * 1.8,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 7,
      wobble: Math.random() * 10,
      wobbleSpeed: 0.05 + Math.random() * 0.04,
    }));

    let animId: number;
    const startTime = performance.now();
    const duration = 4000; // Animação de 4 segundos

    const render = (time: number) => {
      const elapsed = time - startTime;
      if (elapsed > duration) {
        ctx.clearRect(0, 0, width, height);
        return;
      }

      ctx.clearRect(0, 0, width, height);
      // Fade out suave no último segundo
      const opacity = elapsed > duration - 1000 ? (duration - elapsed) / 1000 : 1;
      ctx.globalAlpha = Math.max(0, opacity);

      pieces.forEach(p => {
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(p.wobble) * 0.8;
        p.wobble += p.wobbleSpeed;
        p.rotation += p.rotationSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.sizeW / 2, -p.sizeH / 2, p.sizeW, p.sizeH);
        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth || window.innerWidth;
      height = canvas.height = canvas.offsetHeight || 380;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 w-full h-full z-20"
      aria-hidden="true"
    />
  );
}

export default function RankingGeral() {
  const { data, season } = usePhotoData();

  // Permissão de exportação: apenas Administrador ou Analista (ou permissão de reports)
  const profileName = String(data.role?.name || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const canExport = profileName.includes("admin") || profileName.includes("analista") || Boolean(data.role?.permissions?.includes("reports"));
  const [seasonId, setSeasonId] = useState(season?.id || '');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [clientId, setClientId] = useState('');
  const [postId, setPostId] = useState('');
  const [role, setRole] = useState('');
  const [badge, setBadge] = useState('');
  const currentSeasonId = seasonId || season?.id || '';
  const currentSeason = data.seasons.find(item => item.id === currentSeasonId) || season;
  const ranking = (data.rankings[currentSeasonId] || []) as any[];
  const currentEmployeeId = data.user.employeeId;
  const currentEmployee = ranking.find(item => (item.employeeId || item.id) === currentEmployeeId);

  const rows = ranking
    .filter(item => !search || `${item.name} ${item.registration} ${item.client} ${item.post} ${item.role}`.toLowerCase().includes(search.toLowerCase()))
    .filter(item => !clientId || item.clientId === clientId)
    .filter(item => !postId || item.postId === postId)
    .filter(item => !role || item.role === role)
    .filter(item => !badge || item.badge === badge);

  const clientPosts = data.posts.filter(post => !clientId || post.clientIds?.includes(clientId));
  const roles = [...new Set(ranking.map(item => item.role).filter(Boolean))];
  const evaluated = ranking.filter(item => Number(item.evaluations || 0) > 0);

  // ── Pódio da Temporada: Top 3 Colaboradores Avaliados ──
  const candidatePool = (search || clientId || postId || role || badge) ? rows : ranking;
  const evaluatedCandidates = candidatePool.filter(
    item => Number(item.evaluations || 0) > 0 || Number(item.score || 0) > 0
  );

  const podiumCandidates = [...(evaluatedCandidates.length > 0 ? evaluatedCandidates : evaluated)].sort((a, b) => {
    if (Number(b.score || 0) !== Number(a.score || 0)) {
      return Number(b.score || 0) - Number(a.score || 0);
    }
    return Number(b.evaluations || 0) - Number(a.evaluations || 0);
  });

  const topGold = podiumCandidates[0] || null;   // 1º Lugar (Líder / Ouro - Centro)
  const topSilver = podiumCandidates[1] || null; // 2º Lugar (Prata - Esquerda)
  const topBronze = podiumCandidates[2] || null; // 3º Lugar (Bronze - Direita)

  const podiumCount = [topGold, topSilver, topBronze].filter(Boolean).length;
  const clearFilters = () => { setSearch(''); setClientId(''); setPostId(''); setRole(''); setBadge(''); setSeasonId(season?.id || ''); };
  const activeFilterCount = [search, clientId, postId, role, badge, (seasonId && seasonId !== season?.id) ? seasonId : ''].filter(Boolean).length;

  return (
    <div className="ranking-page page-enter space-y-4">
      {/* ── Cabeçalho Padrão Corporativo Grupo Combate ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 mb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#071e4d] text-[#f5b300] flex items-center justify-center shadow-md shadow-[#071e4d]/20 flex-shrink-0">
            <Trophy size={22} className="text-[#f5b300]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
              Ranking Geral
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Classificação geral dos colaboradores por pontuação e desempenho na temporada {season?.name ? `(${season.name})` : ''}
            </p>
          </div>
        </div>
      </div>
      {currentEmployee && <section className="my-ranking mb-3" aria-label="Minha posição no ranking">
        <Avatar name={currentEmployee.name} src={currentEmployee.photo} size="md" />
        <div className="my-ranking-copy"><span>Sua posição nesta temporada</span><strong>{currentEmployee.position ? `${currentEmployee.position}º lugar` : 'Aguardando classificação'}</strong><small>{currentEmployee.name} · {currentEmployee.client}</small></div>
        <div className="my-ranking-score"><strong>{currentEmployee.score}</strong><span>pontos</span></div>
      </section>}

      {/* ── Pódio Flutuante da Temporada (Fundo Transparente com Confetes) ── */}
      <section className="bg-transparent my-2 sm:my-4 relative overflow-hidden select-none" aria-label="Pódio da temporada">
        {podiumCount > 0 && <ConfettiEffect />}
        <div className="pt-1 pb-1 px-1 sm:px-4 bg-transparent relative z-10 max-w-sm sm:max-w-xl mx-auto">
          {/* ── Visual Pedestal Podium Grid ── */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-4 items-end w-full">
            
            {/* ── 2º LUGAR (ESQUERDA - PRATA) ── */}
            <div className="flex flex-col items-center min-w-0">
              {topSilver ? (
                <div className="flex flex-col items-center w-full mb-1.5">
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] sm:text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs mb-1">
                    🥈 2º
                  </span>
                  <div className="relative mb-1">
                    <div className="w-11 h-11 sm:w-16 sm:h-16 rounded-full ring-2 ring-slate-300 ring-offset-1 overflow-hidden shadow-xs flex items-center justify-center bg-white">
                      <Avatar name={topSilver.name} src={topSilver.photo} size="sm" />
                    </div>
                  </div>
                  <div className="w-full text-center px-0.5">
                    <div className="font-bold text-[10px] sm:text-sm text-slate-800 truncate" title={topSilver.name}>{topSilver.name}</div>
                    <div className="text-[9px] sm:text-xs text-slate-400 truncate" title={`${topSilver.client} · ${topSilver.post}`}>{topSilver.client}</div>
                  </div>
                  <div className="mt-0.5 font-black text-xs sm:text-sm text-slate-700">
                    {topSilver.score} <span className="text-[8px] font-semibold text-slate-400">pts</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center w-full mb-1.5 opacity-60">
                  <span className="text-[9px] font-bold text-slate-500 mb-0.5">🥈 2º</span>
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs mb-0.5 bg-slate-50">?</div>
                  <span className="text-[9px] text-slate-400">Aguardando</span>
                </div>
              )}
              {/* Degrau 2 (Prata) */}
              <div className="w-full h-18 sm:h-26 rounded-t-xl bg-gradient-to-t from-slate-300 via-slate-200 to-slate-100 border-t border-slate-300 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
                <span className="text-2xl sm:text-3xl font-black text-slate-500/30 select-none">2</span>
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-700">PRATA</span>
              </div>
            </div>

            {/* ── 1º LUGAR (CENTRO - OURO / MAIS ALTO) ── */}
            <div className="flex flex-col items-center min-w-0 z-10">
              {topGold ? (
                <div className="flex flex-col items-center w-full mb-1.5">
                  <Crown size={24} className="text-amber-500 fill-amber-400 drop-shadow-md mb-1 animate-crown-float" />
                  <div className="relative mb-1">
                    <div className="w-13 h-13 sm:w-18 sm:h-18 rounded-full ring-3 ring-amber-400 ring-offset-1 overflow-hidden shadow-md flex items-center justify-center bg-white">
                      <Avatar name={topGold.name} src={topGold.photo} size="md" />
                    </div>
                  </div>
                  <div className="w-full text-center px-0.5">
                    <div className="font-extrabold text-xs sm:text-base text-slate-900 truncate" title={topGold.name}>{topGold.name}</div>
                    <div className="text-[9px] sm:text-xs text-amber-700/90 font-semibold truncate" title={`${topGold.client} · ${topGold.post}`}>{topGold.client}</div>
                  </div>
                  <div className="mt-0.5 font-black text-xs sm:text-base text-amber-600">
                    {topGold.score} <span className="text-[9px] font-bold text-amber-500">pts</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center w-full mb-1.5 opacity-60">
                  <Crown size={18} className="text-amber-500/60 mb-0.5" />
                  <span className="text-[9px] font-bold text-amber-700 mb-0.5">🥇 1º</span>
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-dashed border-amber-400 flex items-center justify-center text-amber-600 text-xs mb-0.5 bg-amber-50/50">?</div>
                  <span className="text-[9px] text-slate-400">Aguardando</span>
                </div>
              )}
              {/* Degrau 1 (Ouro) */}
              <div className="w-full h-26 sm:h-36 rounded-t-xl bg-gradient-to-t from-amber-400 via-amber-300 to-amber-200 border-t-2 border-amber-300 shadow-md flex flex-col items-center justify-center relative overflow-hidden">
                <span className="text-3xl sm:text-5xl font-black text-amber-900/30 select-none">1</span>
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-950 flex items-center gap-0.5">
                  🏆 OURO
                </span>
              </div>
            </div>

            {/* ── 3º LUGAR (DIREITA - BRONZE) ── */}
            <div className="flex flex-col items-center min-w-0">
              {topBronze ? (
                <div className="flex flex-col items-center w-full mb-1.5">
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] sm:text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 shadow-2xs mb-1">
                    🥉 3º
                  </span>
                  <div className="relative mb-1">
                    <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full ring-2 ring-amber-700/40 ring-offset-1 overflow-hidden shadow-xs flex items-center justify-center bg-white">
                      <Avatar name={topBronze.name} src={topBronze.photo} size="sm" />
                    </div>
                  </div>
                  <div className="w-full text-center px-0.5">
                    <div className="font-bold text-[10px] sm:text-sm text-slate-800 truncate" title={topBronze.name}>{topBronze.name}</div>
                    <div className="text-[9px] sm:text-xs text-slate-400 truncate" title={`${topBronze.client} · ${topBronze.post}`}>{topBronze.client}</div>
                  </div>
                  <div className="mt-0.5 font-black text-xs sm:text-sm text-amber-900">
                    {topBronze.score} <span className="text-[8px] font-semibold text-slate-400">pts</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center w-full mb-1.5 opacity-60">
                  <span className="text-[9px] font-bold text-amber-800 mb-0.5">🥉 3º</span>
                  <div className="w-10 h-10 sm:w-13 sm:h-13 rounded-full border-2 border-dashed border-amber-300 flex items-center justify-center text-amber-700 text-xs mb-0.5">?</div>
                  <span className="text-[9px] text-slate-400">Aguardando</span>
                </div>
              )}
              {/* Degrau 3 (Bronze) */}
              <div className="w-full h-15 sm:h-20 rounded-t-xl bg-gradient-to-t from-amber-600/30 via-amber-500/20 to-amber-100 border-t border-amber-400/40 shadow-xs flex flex-col items-center justify-center relative overflow-hidden">
                <span className="text-2xl sm:text-3xl font-black text-amber-900/30 select-none">3</span>
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-amber-950">BRONZE</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Toolbar: Busca Rápida + Filtros + Exportar (se admin/analista) ── */}
      <div className="bg-white rounded-2xl p-2.5 sm:p-3.5 border border-slate-100 shadow-xs mb-3 space-y-2">
        <div className="flex items-center gap-2">
          {/* Campo de Busca Rápida */}
          <div className="relative flex-1 group">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Buscar por colaborador, matrícula, empresa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '38px', paddingRight: '30px' }}
              className="w-full h-10 text-xs bg-slate-50 border border-slate-200/90 rounded-xl text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all font-medium"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full cursor-pointer"
                title="Limpar busca"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Botão de Filtros (Quadrado com ícone azul) */}
          <button
            type="button"
            onClick={() => setFiltersOpen(prev => !prev)}
            className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer flex-shrink-0 ${
              filtersOpen || activeFilterCount > 0
                ? 'bg-blue-50 border-blue-300 text-blue-600'
                : 'bg-white border-slate-200/90 text-[#2563eb] hover:bg-slate-50'
            }`}
            title="Filtrar ranking"
          >
            <Filter size={16} />
          </button>

          {/* Exportação (apenas desktop) */}
          {canExport && (
            <a
              href={`/api/export/ranking?season=${encodeURIComponent(currentSeasonId)}`}
              className="hidden sm:inline-flex items-center justify-center gap-1.5 h-10 px-3.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl transition-all shadow-2xs cursor-pointer flex-shrink-0"
              title="Exportar ranking para planilha Excel"
            >
              <Download size={14} className="text-slate-500" />
              <span>Exportar</span>
            </a>
          )}
        </div>

        {/* Indicador de Filtros Ativos */}
        {(activeFilterCount > 0 || search) && (
          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 border-t border-slate-100 px-1">
            <span>
              <strong className="text-slate-700">{rows.length}</strong> participante(s)
            </span>
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <X size={11} />
              <span>Limpar</span>
            </button>
          </div>
        )}

        {/* Painel de Filtros Avançados */}
        {filtersOpen && (
          <div className="pt-2 border-t border-slate-100 space-y-2 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Temporada</label>
                <select className={selectCls} value={currentSeasonId} onChange={event => setSeasonId(event.target.value)}>
                  {data.seasons.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Empresa</label>
                <select className={selectCls} value={clientId} onChange={event => { setClientId(event.target.value); setPostId(''); }}>
                  <option value="">Todas</option>
                  {data.clients.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Posto</label>
                <select className={selectCls} value={postId} onChange={event => setPostId(event.target.value)}>
                  <option value="">Todos</option>
                  {clientPosts.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Função</label>
                <select className={selectCls} value={role} onChange={event => setRole(event.target.value)}>
                  <option value="">Todas</option>
                  {roles.map(item => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Classificação</label>
                <select className={selectCls} value={badge} onChange={event => setBadge(event.target.value)}>
                  <option value="">Todas</option>
                  <option value="ouro">Ouro</option>
                  <option value="prata">Prata</option>
                  <option value="bronze">Bronze</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      <section className="bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-100 shadow-sm overflow-hidden">
        {/* Table Title Bar */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-2">
          <div className="flex items-center gap-2">
            <Trophy size={17} className="text-[#071e4d]" />
            <strong className="text-sm sm:text-base font-bold text-[#071e4d]">
              Classificação da temporada
            </strong>
          </div>
          <div className="flex items-center gap-0.5 text-xs font-bold text-[#2563eb] cursor-pointer hover:underline">
            <span>{currentEmployee?.position ? `${currentEmployee.position}ª posição` : '3ª posição'}</span>
            <ChevronRight size={13} />
          </div>
        </div>

        {/* Guaranteed Fit Table */}
        <div className="w-full overflow-hidden">
          <table className="w-full table-fixed text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-2 px-1 w-10 text-center">POSIÇÃO</th>
                <th className="py-2 px-2 w-[38%]">COLABORADOR</th>
                <th className="py-2 px-2 w-[34%]">EMPRESA / POSTO</th>
                <th className="py-2 px-1 w-[18%] text-right">PONTUAÇÃO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {rows.map((item, index) => {
                const employeeId = item.employeeId || item.id;
                const mine = employeeId === currentEmployeeId;
                const pos = item.position || index + 1;
                return (
                  <tr key={employeeId} className={mine ? 'bg-blue-50/40' : 'hover:bg-slate-50/60'}>
                    {/* Posição */}
                    <td className="py-2.5 px-1 text-center">
                      <span
                        className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-bold shadow-2xs ${
                          pos === 1
                            ? 'bg-[#f5b300] text-white'
                            : pos === 2
                            ? 'bg-[#cbd5e1] text-slate-800'
                            : pos === 3
                            ? 'bg-[#fdba74] text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {pos}
                      </span>
                    </td>

                    {/* Colaborador */}
                    <td className="py-2.5 px-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Avatar name={item.name} src={item.photo} size="xs" />
                        <span className="font-bold text-slate-900 text-xs truncate" title={item.name}>
                          {item.name}
                        </span>
                      </div>
                    </td>

                    {/* Empresa / Posto */}
                    <td className="py-2.5 px-2">
                      <div className="min-w-0">
                        <strong className="block text-[11px] text-slate-800 font-bold truncate" title={item.client}>
                          {item.client}
                        </strong>
                        <small className="block text-[10px] text-slate-400 truncate" title={item.post}>
                          {item.post}
                        </small>
                      </div>
                    </td>

                    {/* Pontuação */}
                    <td className="py-2.5 px-1 text-right font-extrabold text-xs text-slate-900">
                      {item.score}
                    </td>
                  </tr>
                );
              })}
              {!rows.length && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400 text-xs">
                    Nenhum resultado encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Real Results Note */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-2.5 border-t border-slate-100 mt-1">
          <Calendar size={12} className="text-slate-400 flex-shrink-0" />
          <span>Resultados reais de {currentSeason?.name || 'Setembro'}.</span>
        </div>
      </section>
    </div>
  );
}
