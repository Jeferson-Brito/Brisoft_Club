// Avatar component — shows initials with generated color when no photo

const COLORS = ['#1B6EF3','#8b5cf6','#10b981','#f59e0b','#ef4444','#6366f1','#0891b2','#be185d'];

function getColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

function getInitials(name: string) {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface AvatarProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
}

const SIZES = {
  xs: { wh: 'w-7 h-7', text: 'text-xs' },
  sm: { wh: 'w-8 h-8', text: 'text-xs' },
  md: { wh: 'w-10 h-10', text: 'text-sm' },
  lg: { wh: 'w-14 h-14', text: 'text-lg' },
  xl: { wh: 'w-20 h-20', text: 'text-2xl' },
};

export function Avatar({ name, size = 'md', color }: AvatarProps) {
  const { wh, text } = SIZES[size];
  const bg = color ?? getColor(name);
  return (
    <div
      className={`${wh} ${text} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}
      style={{ background: bg }}
    >
      {getInitials(name)}
    </div>
  );
}
