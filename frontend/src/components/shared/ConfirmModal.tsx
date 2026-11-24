import { useState } from "react";

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  onConfirm: () => void | Promise<unknown>;
  onCancel: () => void;
}

export function ConfirmModal({
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [submitting, setSubmitting] = useState(false);

  // Evita clics repetidos mientras la confirmación está en curso.
  async function handleConfirm() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-[380px] shadow-2xl">
        <h3 className="text-base font-bold text-text mb-2">{title}</h3>
        <p className="text-sm text-text-muted mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={submitting}
            onClick={() => {
              if (!submitting) onCancel();
            }}
            className="flex-1 py-2 rounded-md text-sm text-text-muted hover:bg-panel-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleConfirm()}
            className={`flex-1 py-2 rounded-md text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
              variant === "danger" ? "bg-accent-red hover:opacity-90 text-white" : "bg-accent-yellow hover:opacity-90 text-black"
            }`}
          >
            {submitting ? "Procesando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
