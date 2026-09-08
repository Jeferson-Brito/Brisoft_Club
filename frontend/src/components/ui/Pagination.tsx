// Pagination component

interface PaginationProps {
  current: number;
  total: number;
  perPage?: number;
  totalRecords?: number;
  onChange: (page: number) => void;
}

export function Pagination({ current, total, perPage = 10, totalRecords, onChange }: PaginationProps) {
  const pages: (number | '...')[] = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current > 3) pages.push('...');
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 2) pages.push('...');
    pages.push(total);
  }

  const start = (current - 1) * perPage + 1;
  const end = Math.min(current * perPage, totalRecords ?? total * perPage);

  return (
    <div className="flex items-center justify-between px-1 pt-4 pb-1">
      <span className="text-sm text-slate-500">
        Mostrando {start} – {end} {totalRecords ? `de ${totalRecords.toLocaleString('pt-BR')} resultados` : ''}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(current - 1)}
          disabled={current === 1}
          className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ‹
        </button>
        {pages.map((p, i) =>
          p === '...'
            ? <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-slate-400 text-sm">…</span>
            : <button
                key={p}
                onClick={() => onChange(p as number)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  p === current
                    ? 'bg-blue-600 text-white'
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {p}
              </button>
        )}
        <button
          onClick={() => onChange(current + 1)}
          disabled={current === total}
          className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ›
        </button>
      </div>
    </div>
  );
}
