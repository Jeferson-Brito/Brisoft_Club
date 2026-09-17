import { Link, useLocation } from 'react-router-dom';

interface Crumb {
  label: string;
  path?: string;
}

export function Breadcrumbs() {
  const location = useLocation();
  const pathname = location.pathname;
  const searchParams = new URLSearchParams(location.search);
  const tab = searchParams.get('tab');

  const getCrumbs = (): Crumb[] => {
    // 1. Cadastros
    if (pathname === '/colaboradores') {
      return [
        { label: 'Cadastros' },
        { label: 'Colaboradores' },
      ];
    }
    if (pathname === '/colaboradores/novo') {
      return [
        { label: 'Cadastros' },
        { label: 'Colaboradores', path: '/colaboradores' },
        { label: 'Novo Colaborador' },
      ];
    }
    if (pathname.startsWith('/colaboradores/') && pathname.endsWith('/editar')) {
      return [
        { label: 'Cadastros' },
        { label: 'Colaboradores', path: '/colaboradores' },
        { label: 'Editar Colaborador' },
      ];
    }
    if (pathname === '/clientes') {
      return [
        { label: 'Cadastros' },
        { label: 'Clientes' },
      ];
    }
    if (pathname === '/clientes/novo') {
      return [
        { label: 'Cadastros' },
        { label: 'Clientes', path: '/clientes' },
        { label: 'Novo Cliente' },
      ];
    }
    if (pathname.startsWith('/clientes/') && pathname.endsWith('/editar')) {
      return [
        { label: 'Cadastros' },
        { label: 'Clientes', path: '/clientes' },
        { label: 'Editar Cliente' },
      ];
    }
    if (pathname === '/colaboradores/gestao') {
      if (tab === 'allocations') {
        return [
          { label: 'Cadastros' },
          { label: 'Colaboradores', path: '/colaboradores' },
          { label: 'Vínculos de trabalho' },
        ];
      }
      return [
        { label: 'Cadastros' },
        { label: 'Colaboradores', path: '/colaboradores' },
        { label: 'Gestão de Colaboradores' },
      ];
    }
    if (pathname === '/clientes/gestao') {
      if (tab === 'posts') {
        return [
          { label: 'Cadastros' },
          { label: 'Clientes', path: '/clientes' },
          { label: 'Postos' },
        ];
      }
      return [
        { label: 'Cadastros' },
        { label: 'Clientes', path: '/clientes' },
        { label: 'Gestão de Clientes' },
      ];
    }

    // 2. Ranking & Conquistas
    if (pathname.startsWith('/ranking')) {
      return [
        { label: 'Ranking Geral' },
      ];
    }
    if (pathname === '/conquistas') {
      return [
        { label: 'Ranking', path: '/ranking/geral' },
        { label: 'Conquistas' },
      ];
    }

    // 3. Avaliações
    if (pathname === '/avaliacoes/avaliar') {
      return [
        { label: 'Avaliações' },
        { label: 'Avaliar' },
      ];
    }
    if (pathname === '/avaliacoes/concluidas') {
      return [
        { label: 'Avaliações' },
        { label: 'Concluídas' },
      ];
    }
    if (pathname === '/avaliacoes/nao-avaliados') {
      return [
        { label: 'Avaliações' },
        { label: 'Não avaliados' },
      ];
    }

    // 4. Dados e Relatórios
    if (pathname === '/importacoes') {
      return [
        { label: 'Dados e relatórios' },
        { label: 'Importações' },
      ];
    }
    if (pathname === '/relatorios') {
      return [
        { label: 'Dados e relatórios' },
        { label: 'Relatórios' },
      ];
    }

    // 5. WhatsApp
    if (pathname === '/whatsapp') {
      return [{ label: 'WhatsApp' }];
    }

    // 6. Administração
    if (pathname === '/temporadas') {
      return [
        { label: 'Administração' },
        { label: 'Temporadas' },
      ];
    }
    if (pathname === '/temporadas/novo') {
      return [
        { label: 'Administração' },
        { label: 'Temporadas', path: '/temporadas' },
        { label: 'Nova Temporada e Ciclos' },
      ];
    }
    if (pathname.startsWith('/temporadas/') && pathname.endsWith('/editar')) {
      return [
        { label: 'Administração' },
        { label: 'Temporadas', path: '/temporadas' },
        { label: 'Editar Temporada' },
      ];
    }
    if (pathname === '/temporadas/ciclos/novo') {
      return [
        { label: 'Administração' },
        { label: 'Temporadas', path: '/temporadas' },
        { label: 'Novo Ciclo' },
      ];
    }
    if (pathname === '/usuarios') {
      return [
        { label: 'Administração' },
        { label: 'Usuários' },
      ];
    }
    if (pathname === '/usuarios/novo') {
      return [
        { label: 'Administração' },
        { label: 'Usuários', path: '/usuarios' },
        { label: 'Novo Usuário' },
      ];
    }
    if (pathname.startsWith('/usuarios/') && pathname.endsWith('/editar')) {
      return [
        { label: 'Administração' },
        { label: 'Usuários', path: '/usuarios' },
        { label: 'Editar Usuário' },
      ];
    }

    // 7. Configurações
    if (pathname === '/configuracoes') {
      return [{ label: 'Configurações' }];
    }

    // Fallback dinâmico para outras rotas
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) {
      return [{ label: 'Início' }];
    }

    return segments.map((seg, idx) => {
      const isLast = idx === segments.length - 1;
      const formatted = seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');
      return {
        label: formatted,
        path: isLast ? undefined : `/${segments.slice(0, idx + 1).join('/')}`,
      };
    });
  };

  const crumbs = getCrumbs();
  if (!crumbs || crumbs.length === 0) return null;

  const isConstrained =
    pathname.startsWith('/configuracoes') || pathname.startsWith('/whatsapp');

  return (
    <div
      className={`w-full ${
        isConstrained ? 'max-w-7xl mx-auto mb-2.5' : 'mb-3'
      } px-1 flex items-center flex-wrap gap-x-1.5 gap-y-0.5 select-none text-[11px] sm:text-xs leading-none text-slate-400 font-sans`}
      aria-label="Caminho de navegação"
    >
      <span className="font-semibold text-slate-400/90 shrink-0">Você está em:</span>
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <span key={index} className="inline-flex items-center gap-1.5 shrink-0">
            {crumb.path && !isLast ? (
              <Link
                to={crumb.path}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className={isLast ? 'text-slate-500 font-medium' : 'text-slate-400'}>
                {crumb.label}
              </span>
            )}
            {!isLast && (
              <span className="text-slate-300 font-normal select-none" aria-hidden="true">
                &gt;
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
