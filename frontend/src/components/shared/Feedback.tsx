import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, X, RotateCcw, AlertCircle } from "lucide-react";
import { useToastStore, type ToastVariant } from "../../store/useToastStore";

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
  variant?: ToastVariant;
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
  duration?: number;
}) {
  const [isClosing, setIsClosing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const rafRef = useRef<number | null>(null);
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closedRef = useRef(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const startClose = useCallback(() => {
    // Evita ejecutar onClose más de una vez si ya está cerrando.
    if (closedRef.current) return;
    closedRef.current = true;

    if (autoTimerRef.current !== null) {
      clearTimeout(autoTimerRef.current);
      autoTimerRef.current = null;
    }

    setIsClosing(true);
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      onCloseRef.current();
    }, 300);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      setIsMounted(true);
    });

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (closeTimerRef.current !== null) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (closedRef.current) return;

    autoTimerRef.current = setTimeout(() => {
      autoTimerRef.current = null;
      startClose();
    }, duration);

    return () => {
      if (autoTimerRef.current !== null) {
        clearTimeout(autoTimerRef.current);
        autoTimerRef.current = null;
      }
    };
  }, [duration, startClose]);

  const handleClose = () => {
    startClose();
  };

  const handleAction = () => {
    if (closedRef.current) return;
    onAction?.();
    startClose();
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
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      aria-atomic="true"
      className={`${baseClasses} ${stateClasses}`}
    >
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
          type="button"
          onClick={handleAction}
          className="ml-2 flex items-center gap-1 text-xs font-bold text-accent-blue hover:opacity-80 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          {actionLabel}
        </button>
      )}
      <button
        type="button"
        onClick={handleClose}
        className="ml-1 text-text-muted hover:text-text p-1 transition-colors rounded cursor-pointer"
        aria-label="Cerrar notificación"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/** Bandeja global de notificaciones renderizada sobre la aplicación. */
export function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-[calc(100vw-2rem)]">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            message={toast.message}
            variant={toast.variant}
            actionLabel={toast.actionLabel}
            onAction={toast.onAction}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}
