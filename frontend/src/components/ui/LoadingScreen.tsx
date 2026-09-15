export function LoadingScreen({
  error,
  onRetry,
  onLogout,
}: {
  error?: string;
  onRetry?: () => void;
  onLogout?: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50/95 backdrop-blur-xs select-none">
      <div className="flex flex-col items-center max-w-sm px-6 text-center">
        {/* Animated Brand Logo */}
        <div className="relative mb-6">
          <div className="absolute inset-0 -m-4 rounded-full bg-blue-500/15 blur-xl animate-pulse" />
          <img
            src="/logo/Logo_Club_Talentos_Transparente.png"
            alt="Clube de Talentos"
            className="relative h-16 w-auto object-contain drop-shadow-sm animate-pulse duration-1000"
          />
        </div>

        {/* Loading Animation: Modern Animated Line / Bar */}
        {!error && (
          <div className="w-48 h-1.5 bg-slate-200/90 rounded-full overflow-hidden relative shadow-inner">
            <div className="loading-progress-bar h-full rounded-full" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mt-2 p-4 rounded-xl bg-white border border-rose-100 shadow-sm">
            <p className="text-xs text-rose-600 font-medium mb-3">{error}</p>
            <div className="flex items-center gap-2 justify-center">
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Tentar novamente
                </button>
              )}
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Voltar ao login
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}