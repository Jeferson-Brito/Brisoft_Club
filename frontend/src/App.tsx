import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Avaliar from './pages/avaliacoes/Avaliar';
import Pendentes from './pages/avaliacoes/Pendentes';
import Concluidas from './pages/avaliacoes/Concluidas';
import Historico from './pages/avaliacoes/Historico';

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[80vh]">
      <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4 text-2xl">🚧</div>
      <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
      <p className="text-slate-500 mt-2">Página em construção</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          
          <Route path="avaliacoes">
            <Route path="avaliar" element={<Avaliar />} />
            <Route path="pendentes" element={<Pendentes />} />
            <Route path="concluidas" element={<Concluidas />} />
            <Route path="historico" element={<Historico />} />
          </Route>
          
          <Route path="ranking">
            <Route path="geral" element={<PlaceholderPage title="Ranking Geral" />} />
            <Route path="por-cliente" element={<PlaceholderPage title="Ranking Por Cliente" />} />
            <Route path="podio" element={<PlaceholderPage title="Pódio" />} />
            <Route path="historico" element={<PlaceholderPage title="Histórico do Ranking" />} />
          </Route>
          
          <Route path="colaboradores" element={<PlaceholderPage title="Colaboradores" />} />
          <Route path="clientes" element={<PlaceholderPage title="Clientes" />} />
          <Route path="temporadas" element={<PlaceholderPage title="Temporadas" />} />
          <Route path="conquistas" element={<PlaceholderPage title="Conquistas" />} />
          <Route path="importacoes" element={<PlaceholderPage title="Importações" />} />
          <Route path="relatorios" element={<PlaceholderPage title="Relatórios" />} />
          <Route path="usuarios" element={<PlaceholderPage title="Usuários e Acessos" />} />
          <Route path="configuracoes" element={<PlaceholderPage title="Configurações" />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
