import { useState } from "react";
import type { Project } from "../../../types";
import { PALETTE, getAccessibleColor } from "../../../constants/ui";
import { useIsDark } from "../../../context/ThemeContext";
import { Modal } from "../../shared/Modal";

export function NewProjectModal({
  onCreate,
  onClose,
}: {
  onCreate: (p: Omit<Project, "id" | "categories" | "members">) => Promise<boolean> | boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [course, setCourse] = useState("");
  const [color, setColor] = useState(PALETTE[0]);
  const [submitting, setSubmitting] = useState(false);
  const isDark = useIsDark();

  // Espera confirmación del backend antes de cerrar el modal.
  async function handleSubmit() {
    if (submitting || !name.trim()) return;
    setSubmitting(true);
    try {
      const ok = await onCreate({ name, course, color, description: "" });
      if (ok) {
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={() => {
        if (!submitting) onClose();
      }}
      titleId="new-project-modal-title"
      maxWidthClass="max-w-[400px]"
      closeOnBackdropClick={!submitting}
      closeOnEscape={!submitting}
      className="p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 id="new-project-modal-title" className="text-lg font-bold text-text">Nuevo Proyecto</h2>
        <button
          type="button"
          disabled={submitting}
          onClick={() => {
            if (!submitting) onClose();
          }}
          aria-label="Cerrar modal"
          title="Cerrar modal"
          className="text-text-muted hover:text-text disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="project-name" className="block text-xs font-mono text-text-muted mb-1.5 uppercase cursor-pointer">Nombre</label>
          <input id="project-name" autoFocus value={name} onChange={e => setName(e.target.value)} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-text placeholder-text-muted focus:outline-none focus:border-accent-blue transition-colors" placeholder="Ej: Sistema de Biblioteca" />
        </div>
        <div>
          <label htmlFor="project-course" className="block text-xs font-mono text-text-muted mb-1.5 uppercase cursor-pointer">Ramo (Opcional)</label>
          <input id="project-course" value={course} onChange={e => setCourse(e.target.value)} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-text placeholder-text-muted focus:outline-none focus:border-accent-blue transition-colors" placeholder="Ej: IIC2143" />
        </div>
        <div>
          <span id="project-color-label" className="block text-xs font-mono text-text-muted mb-2 uppercase">Color</span>
          <div className="flex gap-2" role="group" aria-labelledby="project-color-label">
            {PALETTE.map(c => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                aria-label={`Color ${c}`}
                aria-pressed={color === c}
                className={`w-6 h-6 rounded-full transition-transform hover:scale-110 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue ${color === c ? "ring-2 ring-text ring-offset-2 ring-offset-surface" : ""}`}
                style={{ backgroundColor: getAccessibleColor(c, isDark) }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <button
          type="button"
          disabled={submitting}
          onClick={() => {
            if (!submitting) onClose();
          }}
          className="flex-1 px-4 py-2 rounded-md text-sm font-medium text-text-muted hover:bg-panel-hover hover:text-text transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={submitting || !name.trim()}
          onClick={() => void handleSubmit()}
          className="flex-1 px-4 py-2 bg-accent-blue text-white rounded-md text-sm font-medium hover:opacity-90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {submitting ? "Creando..." : "Crear Proyecto"}
        </button>
      </div>
    </Modal>
  );
}
