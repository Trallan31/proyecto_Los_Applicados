import { useEffect, useRef, useState } from "react";

// Pila de modales abiertos para que Escape cierre solo el diálogo superior.
const openModalStack: symbol[] = [];

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  titleId?: string;
  ariaLabel?: string;
  maxWidthClass?: string;
  zIndexClass?: string;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * Contenedor accesible reutilizable para diálogos modales.
 * Gestiona roles ARIA, tecla Escape, clic en el fondo y restauración de foco.
 */
export function Modal({ isOpen, ...rest }: ModalProps) {
  if (!isOpen) return null;
  return <ModalDialog {...rest} />;
}

function ModalDialog({
  onClose,
  titleId,
  ariaLabel,
  maxWidthClass = "max-w-md",
  zIndexClass = "z-50",
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className = "",
  children,
}: Omit<ModalProps, "isOpen">) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const isMountedEffectRef = useRef(false);
  const onCloseRef = useRef(onClose);
  const closeOnEscapeRef = useRef(closeOnEscape);

  // Captura el elemento enfocado antes de que el modal y sus hijos (autoFocus) se monten.
  const [previousFocus] = useState<HTMLElement | null>(() => {
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      return document.activeElement;
    }
    return null;
  });
  const [modalToken] = useState<symbol>(() => Symbol("modal"));

  useEffect(() => {
    onCloseRef.current = onClose;
    closeOnEscapeRef.current = closeOnEscape;
  }, [onClose, closeOnEscape]);

  useEffect(() => {
    isMountedEffectRef.current = true;
    openModalStack.push(modalToken);

    const dialogEl = dialogRef.current;
    if (dialogEl && !dialogEl.contains(document.activeElement)) {
      dialogEl.focus();
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (openModalStack[openModalStack.length - 1] !== modalToken) return;
      e.stopPropagation();
      if (!closeOnEscapeRef.current) return;
      e.preventDefault();
      onCloseRef.current();
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      isMountedEffectRef.current = false;
      document.removeEventListener("keydown", handleKeyDown);
      const idx = openModalStack.lastIndexOf(modalToken);
      if (idx !== -1) {
        openModalStack.splice(idx, 1);
      }

      // Microtarea para evitar que React.StrictMode devuelva el foco fuera de autoFocus al re-ejecutar efectos.
      queueMicrotask(() => {
        if (!isMountedEffectRef.current && previousFocus && previousFocus.isConnected) {
          previousFocus.focus();
        }
      });
    };
  }, [modalToken, previousFocus]);

  const hasBgClass = /\bbg-/.test(className);

  return (
    <div
      className={`fixed inset-0 ${zIndexClass} flex items-center justify-center bg-black/60 backdrop-blur-sm p-4`}
      onClick={(e) => {
        if (closeOnBackdropClick && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-label={!titleId ? ariaLabel : undefined}
        tabIndex={-1}
        className={`w-full ${maxWidthClass} ${hasBgClass ? "" : "bg-surface"} border border-border rounded-xl shadow-2xl focus:outline-none ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
