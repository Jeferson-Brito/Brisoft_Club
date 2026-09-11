import { useState } from 'react';
import { Download, Filter, Medal, Search, Trophy, Users, X, Crown } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { usePhotoData } from '../../app/photo-data';

const selectCls = 'w-full min-h-9 text-sm font-medium border border-slate-200 rounded-lg px-3 bg-white text-slate-700 outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer';

export default function RankingGeral() {
  const { data, season } = usePhotoData();
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
    .filter(item => !search || `${item.name} ${item.registration}`.toLowerCase().includes(search.toLowerCase()))
    .filter(item => !clientId || item.clientId === clientId)
    .filter(item => !postId || item.postId === postId)
    .filter(item => !role || item.role === role)
    .filter(item => !badge || item.badge === badge);

  const clientPosts = data.posts.filter(post => !clientId || post.clientIds?.includes(clientId));
  const roles = [...new Set(ranking.map(item => item.role).filter(Boolean))];
  const evaluated = ranking.filter(item => Number(item.evaluations || 0) > 0);
  const podium = evaluated.slice(0, 3);
  const average = evaluated.length ? Math.round(evaluated.reduce((sum, item) => sum + Number(item.score || 0), 0) / evaluated.length) : 0;
  const clearFilters = () => { setSearch(''); setClientId(''); setPostId(''); setRole(''); setBadge(''); };

  return (
    <div className="ranking-page page-enter">
      <header className="ranking-header !justify-end mb-3">
        <label className="ranking-season"><span>Temporada</span><select value={currentSeasonId} onChange={event => setSeasonId(event.target.value)}>{data.seasons.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      </header>

      {currentEmployee && <section className="my-ranking" aria-label="Minha posição no ranking">
        <Avatar name={currentEmployee.name} src={currentEmployee.photo} size="md" />
        <div className="my-ranking-copy"><span>Sua posição nesta temporada</span><strong>{currentEmployee.position ? `${currentEmployee.position}º lugar` : 'Aguardando classificação'}</strong><small>{currentEmployee.name} · {currentEmployee.client}</small></div>
        <div className="my-ranking-score"><strong>{currentEmployee.score}</strong><span>pontos</span></div>
      </section>}

      <section className="ranking-overview" aria-label="Resumo do ranking">
        <div><Users size={19} /><span><strong>{ranking.length}</strong><small>participantes</small></span></div>
        <div><Trophy size={19} /><span><strong>{evaluated.length}</strong><small>avaliados</small></span></div>
        <div><Medal size={19} /><span><strong>{average}</strong><small>média de pontos</small></span></div>
        <div className="ranking-leader"><Avatar name={ranking[0]?.name || '—'} src={ranking[0]?.photo} size="sm" /><span><strong>{ranking[0]?.name || 'Sem resultado'}</strong><small>{ranking[0] ? `1º lugar · ${ranking[0].score} pontos` : 'Aguardando avaliações'}</small></span></div>
      </section>

      {/* ── Pódio Real da Temporada ── */}
      <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden mb-4" aria-label="Pódio da temporada">
        <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2 text-amber-500 font-bold text-sm">
            <Trophy size={18} className="text-amber-500" />
            <strong className="text-slate-800 text-sm sm:text-base">Pódio da temporada</strong>
          </div>
          <span className="text-xs text-slate-500 hidden sm:inline">Os colaboradores com maior pontuação</span>
        </header>

        {podium.length > 0 ? (
          <div className="pt-6 pb-3 px-2 sm:px-6 bg-gradient-to-b from-amber-50/20 via-white to-slate-50/70">
            {/* ── Visual Pedestal Podium Grid (Sempre 3 colunas, inclusive no mobile) ── */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-4 items-end max-w-xl mx-auto">
              
              {/* ── 2º LUGAR (ESQUERDA - PRATA) ── */}
              <div className="flex flex-col items-center min-w-0">
                {podium[1] ? (
                  <div className="flex flex-col items-center w-full mb-2">
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs mb-1.5">
                      🥈 2º
                    </span>
                    <div className="relative mb-1">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full ring-3 ring-slate-300 ring-offset-2 overflow-hidden shadow-sm flex items-center justify-center bg-white">
                        <Avatar name={podium[1].name} src={podium[1].photo} size="md" />
                      </div>
                    </div>
                    <div className="w-full text-center px-0.5">
                      <div className="font-bold text-[11px] sm:text-sm text-slate-800 truncate" title={podium[1].name}>{podium[1].name}</div>
                      <div className="text-[9px] sm:text-xs text-slate-400 truncate" title={`${podium[1].client} · ${podium[1].post}`}>{podium[1].client}</div>
                    </div>
                    <div className="mt-0.5 font-black text-xs sm:text-sm text-slate-700">
                      {podium[1].score} <span className="text-[9px] font-semibold text-slate-400">pts</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center w-full mb-2 opacity-50">
                    <span className="text-[10px] font-bold text-slate-400 mb-1">🥈 2º</span>
                    <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs mb-1">?</div>
                    <span className="text-[9px] text-slate-400">Aguardando</span>
                  </div>
                )}
                {/* Degrau 2 */}
                <div className="w-full h-20 sm:h-28 rounded-t-xl bg-gradient-to-t from-slate-300 via-slate-200 to-slate-100 border-t-2 border-x border-slate-300 shadow-xs flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-1 bg-white/60" />
                  <span className="text-3xl sm:text-4xl font-black text-slate-500/40 select-none">2</span>
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-600/80">Prata</span>
                </div>
              </div>

              {/* ── 1º LUGAR (CENTRO - OURO / MAIS ALTO) ── */}
              <div className="flex flex-col items-center min-w-0 z-10">
                {podium[0] ? (
                  <div className="flex flex-col items-center w-full mb-2">
                    <Crown size={22} className="text-amber-500 fill-amber-400 drop-shadow-sm mb-0.5" />
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-xs mb-1.5">
                      🥇 1º
                    </span>
                    <div className="relative mb-1">
                      <div className="w-15 h-15 sm:w-20 sm:h-20 rounded-full ring-4 ring-amber-400 ring-offset-2 overflow-hidden shadow-md flex items-center justify-center bg-white">
                        <Avatar name={podium[0].name} src={podium[0].photo} size="lg" />
                      </div>
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider shadow-xs whitespace-nowrap">
                        LÍDER
                      </span>
                    </div>
                    <div className="w-full text-center px-0.5">
                      <div className="font-extrabold text-xs sm:text-base text-slate-900 truncate" title={podium[0].name}>{podium[0].name}</div>
                      <div className="text-[9px] sm:text-xs text-amber-700/80 font-semibold truncate" title={`${podium[0].client} · ${podium[0].post}`}>{podium[0].client}</div>
                    </div>
                    <div className="mt-0.5 font-black text-sm sm:text-base text-amber-600">
                      {podium[0].score} <span className="text-[10px] font-bold text-amber-500">pts</span>
                    </div>
                  </div>
                ) : null}
                {/* Degrau 1 (Mais Alto) */}
                <div className="w-full h-30 sm:h-40 rounded-t-2xl bg-gradient-to-t from-amber-400 via-amber-300 to-amber-200 border-t-4 border-x-2 border-amber-300 shadow-md flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-1.5 bg-white/70" />
                  <span className="text-4xl sm:text-6xl font-black text-amber-800/40 select-none">1</span>
                  <span className="text-[9px] sm:text-xs font-black uppercase tracking-wider text-amber-950 flex items-center gap-1">
                    <Trophy size={11} className="text-amber-800" /> Campeão
                  </span>
                </div>
              </div>

              {/* ── 3º LUGAR (DIREITA - BRONZE) ── */}
              <div className="flex flex-col items-center min-w-0">
                {podium[2] ? (
                  <div className="flex flex-col items-center w-full mb-2">
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 shadow-2xs mb-1.5">
                      🥉 3º
                    </span>
                    <div className="relative mb-1">
                      <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full ring-3 ring-amber-700/40 ring-offset-2 overflow-hidden shadow-sm flex items-center justify-center bg-white">
                        <Avatar name={podium[2].name} src={podium[2].photo} size="md" />
                      </div>
                    </div>
                    <div className="w-full text-center px-0.5">
                      <div className="font-bold text-[11px] sm:text-sm text-slate-800 truncate" title={podium[2].name}>{podium[2].name}</div>
                      <div className="text-[9px] sm:text-xs text-slate-400 truncate" title={`${podium[2].client} · ${podium[2].post}`}>{podium[2].client}</div>
                    </div>
                    <div className="mt-0.5 font-black text-xs sm:text-sm text-amber-900">
                      {podium[2].score} <span className="text-[9px] font-semibold text-slate-400">pts</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center w-full mb-2 opacity-50">
                    <span className="text-[10px] font-bold text-amber-800 mb-1">🥉 3º</span>
                    <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-full border-2 border-dashed border-amber-300 flex items-center justify-center text-amber-700 text-xs mb-1">?</div>
                    <span className="text-[9px] text-slate-400">Aguardando</span>
                  </div>
                )}
                {/* Degrau 3 (Mais Baixo) */}
                <div className="w-full h-15 sm:h-22 rounded-t-xl bg-gradient-to-t from-amber-700/30 via-amber-600/20 to-amber-100 border-t-2 border-x border-amber-600/30 shadow-xs flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-1 bg-white/50" />
                  <span className="text-2xl sm:text-3xl font-black text-amber-900/30 select-none">3</span>
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-amber-900/70">Bronze</span>
                </div>
              </div>

            </div>

            {/* Linha base de apoio do pódio */}
            <div className="max-w-xl mx-auto h-2 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded-b-xl border-t border-slate-300/70" />
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-500">
            O pódio aparecerá assim que a primeira avaliação for concluída.
          </div>
        )}
      </section>

      <div className="ranking-actions">
        <button className={`filter-button ${filtersOpen ? 'active' : ''}`} onClick={() => setFiltersOpen(value => !value)} aria-expanded={filtersOpen}><Filter size={16} /> Filtros{[search, clientId, postId, role, badge].filter(Boolean).length > 0 && <span>{[search, clientId, postId, role, badge].filter(Boolean).length}</span>}</button>
        <a href={`/api/export/ranking?season=${encodeURIComponent(currentSeasonId)}`} className="ranking-export"><Download size={15} /> Exportar</a>
      </div>

      {filtersOpen && <section className="ranking-filters" aria-label="Filtros do ranking">
        <label className="ranking-search"><span>Buscar colaborador</span><div><Search size={15} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Nome ou matrícula" /></div></label>
        <label><span>Empresa</span><select className={selectCls} value={clientId} onChange={event => { setClientId(event.target.value); setPostId(''); }}><option value="">Todas</option>{data.clients.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label><span>Posto</span><select className={selectCls} value={postId} onChange={event => setPostId(event.target.value)}><option value="">Todos</option>{clientPosts.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label><span>Função</span><select className={selectCls} value={role} onChange={event => setRole(event.target.value)}><option value="">Todas</option>{roles.map(item => <option key={item} value={item}>{item}</option>)}</select></label>
        <label><span>Classificação</span><select className={selectCls} value={badge} onChange={event => setBadge(event.target.value)}><option value="">Todas</option><option value="ouro">Ouro</option><option value="prata">Prata</option><option value="bronze">Bronze</option><option value="diamante">Diamante</option></select></label>
        <button className="clear-ranking-filters" onClick={clearFilters}><X size={15} /> Limpar</button>
      </section>}

      <section className="ranking-table-card">
        <div className="ranking-table-title"><div><Trophy size={17} /><strong>Classificação da temporada</strong></div><span>{rows.length} resultado{rows.length === 1 ? '' : 's'}</span></div>
        <div className="ranking-table-scroll"><table>
          <thead><tr><th>Posição</th><th>Colaborador</th><th>Empresa / posto</th><th>Função</th><th>Avaliações</th><th>Pontos</th><th>Classificação</th></tr></thead>
          <tbody>{rows.map((item, index) => {
            const employeeId = item.employeeId || item.id;
            const mine = employeeId === currentEmployeeId;
            return <tr key={employeeId} className={mine ? 'is-current-employee' : ''}>
              <td><span className={`rank-position rank-${item.position || index + 1}`}>{item.position || index + 1}º</span></td>
              <td><div className="ranking-person"><Avatar name={item.name} src={item.photo} size="sm" /><span><strong>{item.name}</strong><small>{item.registration}{mine ? ' · Você' : ''}</small></span></div></td>
              <td><strong>{item.client}</strong><small>{item.post}</small></td><td>{item.role}</td><td>{item.evaluations || 0}</td><td className="ranking-points">{item.score}</td><td><span className={`ranking-badge badge-${item.badge || 'none'}`}>{item.badge || 'Sem classificação'}</span></td>
            </tr>;
          })}{!rows.length && <tr><td colSpan={7} className="ranking-empty">Nenhum resultado encontrado para os filtros selecionados.</td></tr>}</tbody>
        </table></div>
        <footer>Resultados reais de {currentSeason?.name || 'temporada não selecionada'}.</footer>
      </section>
    </div>
  );
}
