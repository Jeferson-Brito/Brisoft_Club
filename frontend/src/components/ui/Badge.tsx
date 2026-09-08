// Badge component for Ouro, Prata, Bronze, Diamante and status badges

interface BadgeProps {
  type: 'ouro' | 'prata' | 'bronze' | 'diamante' | 'ativo' | 'inativo' | 'pendente' | 'atrasado' | 'andamento' | 'concluida' | 'encerrada' | 'erro' | 'processando' | 'licenca' | 'implantacao';
  size?: 'sm' | 'md';
}

const BADGE_CONFIG = {
  ouro:        { label: 'Ouro',       icon: '🏆', css: 'badge-ouro' },
  prata:       { label: 'Prata',      icon: '🥈', css: 'badge-prata' },
  bronze:      { label: 'Bronze',     icon: '🥉', css: 'badge-bronze' },
  diamante:    { label: 'Diamante',   icon: '💎', css: 'badge-diamante' },
  ativo:       { label: 'Ativo',      icon: '',   css: 'badge-ativo' },
  inativo:     { label: 'Inativo',    icon: '',   css: 'badge-inativo' },
  licenca:     { label: 'Licença',    icon: '',   css: 'badge-pendente' },
  implantacao: { label: 'Implantação',icon: '',   css: 'badge-processando' },
  pendente:    { label: 'Pendente',   icon: '',   css: 'badge-pendente' },
  atrasado:    { label: 'Atrasado',   icon: '',   css: 'badge-atrasado' },
  andamento:   { label: 'Em andamento', icon: '', css: 'badge-andamento' },
  concluida:   { label: 'Concluída',  icon: '',   css: 'badge-concluida' },
  encerrada:   { label: 'Encerrada',  icon: '',   css: 'badge-encerrada' },
  erro:        { label: 'Erro',       icon: '',   css: 'badge-erro' },
  processando: { label: 'Em processamento', icon: '', css: 'badge-processando' },
};

export function Badge({ type }: BadgeProps) {
  const config = BADGE_CONFIG[type];
  if (!config) return null;
  return (
    <span className={config.css}>
      {config.icon && <span>{config.icon}</span>}
      {config.label}
    </span>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  const scores = [score, score, score]; // simplified display
  return (
    <div className="flex gap-1">
      {scores.map((s, i) => (
        <span
          key={i}
          className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold text-white"
          style={{ background: s >= 5 ? '#059669' : s >= 4 ? '#10b981' : s >= 3 ? '#f59e0b' : '#ef4444' }}
        >
          {s}
        </span>
      ))}
    </div>
  );
}
