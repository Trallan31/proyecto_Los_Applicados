import { useEffect } from "react";
import { CheckCircle2, X, RotateCcw } from "lucide-react";

/** Estados de carga y de error de la API, compartidos por las dos vistas. */

export function Loading({ label = "Cargando..." }: { label?: string }) {
  return (
    <div className="h-full flex items-center justify-center">
      <span className="text-[12px] font-mono text-text-muted">{label}</span>
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="h-full flex items-center justify-center px-6">
      <div className="max-w-md text-center space-y-2">
        <p className="text-[13px] font-semibold text-[#ff5c6a]">No se pudieron cargar los datos</p>
        <p className="text-[12px] text-text-muted">{message}</p>
        <p className="text-[11px] font-mono text-text-dim">npm run dev --prefix backend</p>
      </div>
    </div>
  );
}

export function Toast({
  message,
  actionLabel = "Deshacer",
  onAction,
  onClose,
  duration = 4500,
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
  duration?: number;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className="flex items-center gap-3 bg-surface border border-border px-4 py-3 rounded-xl shadow-lg shadow-black/10 text-text transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
      <div className="w-6 h-6 rounded-full bg-[#2dd67b]/20 text-[#2dd67b] flex items-center justify-center flex-shrink-0">
        <CheckCircle2 className="w-4 h-4" />
      </div>
      <span className="text-[13px] font-medium">{message}</span>
      {onAction && (
        <button
          onClick={() => {
            onAction();
            onClose();
          }}
          className="ml-2 flex items-center gap-1 text-xs font-bold text-[#4f7cff] hover:text-[#3d6ae0] transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          {actionLabel}
        </button>
      )}
      <button
        onClick={onClose}
        className="ml-1 text-text-dim hover:text-text p-1 transition-colors rounded"
        aria-label="Cerrar notificación"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
