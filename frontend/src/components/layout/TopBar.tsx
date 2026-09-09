import { Bell, Search, ChevronDown, Menu } from 'lucide-react';
import { Avatar } from '../ui/Avatar';

interface TopBarProps {
  onToggleSidebar: () => void;
  placeholder?: string;
}

export function TopBar({ onToggleSidebar, placeholder = 'Buscar colaboradores, clientes, avaliações...' }: TopBarProps) {
  return (
    <header className="h-14 bg-white border-b border-slate-100 flex items-center px-4 gap-4 flex-shrink-0 shadow-sm">
      <button
        onClick={onToggleSidebar}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
      >
        <Menu size={18} />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-md relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder={placeholder}
          className="w-full pl-11 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all placeholder:text-slate-400"
        />
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {/* Notifications */}
        <button className="relative w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">3</span>
        </button>

        {/* User */}
        <button className="flex items-center gap-2.5 pl-3 border-l border-slate-100 hover:bg-slate-50 rounded-xl px-2 py-1.5 transition-colors">
          <Avatar name="João Silva" size="sm" color="#1B6EF3" />
          <div className="text-left hidden sm:block">
            <div className="text-sm font-semibold text-slate-800 leading-tight">João Silva</div>
            <div className="text-xs text-slate-400 leading-tight">Analista Combate</div>
          </div>
          <ChevronDown size={14} className="text-slate-400" />
        </button>
      </div>
    </header>
  );
}
