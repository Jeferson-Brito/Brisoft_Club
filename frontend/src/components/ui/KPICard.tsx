// KPI Card component — used at the top of every page

interface KPICardProps {
  icon: React.ReactNode;
  iconVariant?: 'blue' | 'green' | 'amber' | 'purple' | 'red' | 'orange';
  value: string | number;
  label: string;
  sub?: string;
  change?: string;
  changePositive?: boolean;
  extra?: React.ReactNode;
}

const ICON_CLASSES = {
  blue:   'kpi-icon-blue',
  green:  'kpi-icon-green',
  amber:  'kpi-icon-amber',
  purple: 'kpi-icon-purple',
  red:    'kpi-icon-red',
  orange: 'kpi-icon-orange',
};

export function KPICard({ icon, iconVariant = 'blue', value, label, sub, change, changePositive, extra }: KPICardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col gap-3">
      <div className="flex items-start gap-4">
        <div className={ICON_CLASSES[iconVariant]}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-2xl font-bold text-slate-800 leading-tight">{value}</div>
          <div className="text-sm text-slate-500 font-medium mt-0.5">{label}</div>
          {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
          {change && (
            <div className={`text-xs font-semibold mt-1 flex items-center gap-1 ${changePositive !== false ? 'text-emerald-600' : 'text-red-500'}`}>
              <span>{changePositive !== false ? '↑' : '↑'}</span>
              {change}
            </div>
          )}
        </div>
      </div>
      {extra && <div>{extra}</div>}
    </div>
  );
}
