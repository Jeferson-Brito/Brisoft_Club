import { useState } from 'react';
import { Download, Filter, Medal, Search, Trophy, Users, X } from 'lucide-react';
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

      <section className="ranking-podium" aria-label="Pódio da temporada">
        <header><div><Trophy size={18} /><strong>Pódio da temporada</strong></div><span>Os três colaboradores com maior pontuação</span></header>
        {podium.length ? <div className="podium-grid">
          {[podium[1], podium[0], podium[2]].filter(Boolean).map((item: any) => {
            const position = podium.indexOf(item) + 1;
            return <article key={item.employeeId || item.id} className={`podium-place podium-place-${position}`}>
              <span className="podium-medal">{position === 1 ? '🥇' : position === 2 ? '🥈' : '🥉'}</span>
              <Avatar name={item.name} src={item.photo} size="md" />
              <div><strong>{item.name}</strong><small>{item.client} · {item.post}</small></div>
              <b>{item.score} <small>pontos</small></b>
            </article>;
          })}
        </div> : <div className="podium-empty">O pódio aparecerá assim que a primeira avaliação for concluída.</div>}
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
