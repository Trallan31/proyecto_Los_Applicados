import { useEffect, useState } from "react";
import { CheckCircle2, X, RotateCcw, AlertCircle } from "lucide-react";

/** Estados de carga y de error de la API, compartidos por las dos vistas. */

export function Loading({ label = "Cargando..." }: { label?: string }) {
  return (
    <div className="h-full flex items-center justify-center">
      <span className="text-[12px] font-mono text-text-muted">{label}</span>
    </div>
  );
}

export function ErrorBox({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="h-full flex items-center justify-center px-6">
      <div className="max-w-md text-center space-y-3">
        <p className="text-[13px] font-semibold text-accent-red">No se pudieron cargar los datos</p>
        <p className="text-[12px] text-text-muted">{message}</p>
        <p className="text-[11px] font-mono text-text-muted">npm run dev --prefix backend</p>
        {onRetry && (
          <div className="pt-2">
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-accent-blue hover:bg-accent-blue/90 text-white text-[12px] font-semibold rounded-lg shadow-sm transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reintentar</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function Toast({
  message,
  variant = "success",
  actionLabel = "Deshacer",
  onAction,
  onClose,
  duration = 4500,
}: {
  message: string;
  variant?: "success" | "error";
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
  duration?: number;
}) {
  const [isClosing, setIsClosing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsMounted(true));
    
    const timer = setTimeout(() => {
      setIsClosing(true);
      setTimeout(() => {
        onClose();
      }, 300); 
    }, duration);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleAction = () => {
    if (onAction) onAction();
    handleClose();
  };

  const isError = variant === "error";
  const baseClasses = `flex items-center gap-3 bg-surface border ${
    isError ? "border-accent-red/50 shadow-accent-red/10" : "border-border shadow-black/10"
  } px-4 py-3 rounded-xl shadow-lg text-text transition-all duration-300 transform`;
  const stateClasses = isClosing 
    ? "opacity-0 translate-x-12" 
    : isMounted 
      ? "opacity-100 translate-y-0 translate-x-0" 
      : "opacity-0 translate-y-4";

  return (
    <div className={`${baseClasses} ${stateClasses}`}>
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
          isError ? "bg-accent-red/20 text-accent-red" : "bg-accent-green/20 text-accent-green"
        }`}
      >
        {isError ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
      </div>
      <span className="text-[13px] font-medium">{message}</span>
      {onAction && (
        <button
          onClick={handleAction}
          className="ml-2 flex items-center gap-1 text-xs font-bold text-accent-blue hover:opacity-80 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          {actionLabel}
        </button>
      )}
      <button
        onClick={handleClose}
        className="ml-1 text-text-muted hover:text-text p-1 transition-colors rounded cursor-pointer"
        aria-label="Cerrar notificación"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
