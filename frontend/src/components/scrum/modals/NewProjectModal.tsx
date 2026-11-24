import { useState } from "react";
import type { Project } from "../../../types";
import { PALETTE } from "../../../constants/ui";

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
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-[400px] shadow-2xl">
        <h2 className="text-lg font-bold text-text mb-6">Nuevo Proyecto</h2>

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
            <label className="block text-xs font-mono text-text-muted mb-2 uppercase cursor-pointer">Color</label>
            <div className="flex gap-2">
              {PALETTE.map(c => (
                <button type="button" key={c} onClick={() => setColor(c)} className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${color === c ? "ring-2 ring-text ring-offset-2 ring-offset-surface" : ""}`} style={{ backgroundColor: c }} />
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
            className="flex-1 px-4 py-2 rounded-md text-sm font-medium text-text-muted hover:bg-panel-hover hover:text-text transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
      </div>
    </div>
  );
}
