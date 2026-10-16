import { useState, useEffect } from "react";
import type { ProjectLink, ProjectLinkCategory } from "../../../types";

interface ProjectLinkModalProps {
  isOpen: boolean;
  linkToEdit?: ProjectLink | null;
  onClose: () => void;
  onSave: (link: Omit<ProjectLink, "id">) => void;
}

const CATEGORIES: { value: ProjectLinkCategory; label: string }[] = [
  { value: "repositorio", label: "Repositorio" },
  { value: "diseño", label: "Diseño" },
  { value: "documentación", label: "Documentación" },
  { value: "deploy", label: "Deploy" },
  { value: "otro", label: "Otro" },
];

export function ProjectLinkModal({
  isOpen,
  linkToEdit,
  onClose,
  onSave,
}: ProjectLinkModalProps) {
  const [title, setTitle] = useState(linkToEdit?.title ?? "");
  const [url, setUrl] = useState(linkToEdit?.url ?? "");
  const [category, setCategory] = useState<ProjectLinkCategory>(linkToEdit?.category ?? "otro");

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    let trimmedUrl = url.trim();

    if (!trimmedTitle || !trimmedUrl) return;

    if (!/^https?:\/\//i.test(trimmedUrl)) {
      trimmedUrl = `https://${trimmedUrl}`;
    }

    onSave({
      title: trimmedTitle,
      url: trimmedUrl,
      category,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-link-modal-title"
    >
      <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-[420px] shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 id="project-link-modal-title" className="text-lg font-bold text-text">
            {linkToEdit ? "Editar Enlace" : "Nuevo Enlace Importante"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-text transition-colors p-1 rounded-md text-sm"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="link-title" className="block text-xs font-mono text-text-muted mb-1.5 uppercase cursor-pointer">
              Título <span className="text-accent-red">*</span>
            </label>
            <input
              id="link-title"
              type="text"
              autoFocus
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Repositorio GitHub, Figma, Docs"
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-text placeholder-text-muted focus:outline-none focus:border-accent-blue transition-colors"
            />
          </div>

          <div>
            <label htmlFor="link-url" className="block text-xs font-mono text-text-muted mb-1.5 uppercase cursor-pointer">
              URL <span className="text-accent-red">*</span>
            </label>
            <input
              id="link-url"
              type="text"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/..."
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-text placeholder-text-muted focus:outline-none focus:border-accent-blue transition-colors font-mono text-xs"
            />
            <p className="text-[11px] text-text-muted mt-1">
              Si omites el protocolo, se agregará <code>https://</code> automáticamente.
            </p>
          </div>

          <div>
            <label htmlFor="link-category" className="block text-xs font-mono text-text-muted mb-1.5 uppercase cursor-pointer">
              Categoría
            </label>
            <select
              id="link-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ProjectLinkCategory)}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:border-accent-blue transition-colors cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value} className="bg-surface text-text">
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-md text-sm font-medium text-text-muted hover:bg-panel-hover hover:text-text transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !url.trim()}
              className="flex-1 px-4 py-2 bg-accent-blue text-white rounded-md text-sm font-medium hover:opacity-90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Guardar enlace
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
