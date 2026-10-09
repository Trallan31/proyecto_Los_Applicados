import { useState } from "react";
import type { Project, Member, Sprint } from "../../../types";
import { ConfirmModal } from "../../shared/ConfirmModal";

export function SettingsModal({
  project,
  members,
  sprints,
  onRemove,
  onUpdateRole,
  onDeleteCategory,
  onDeleteSprint,
  onDeleteProject,
  onClose,
}: {
  project: Project;
  members: Member[];
  sprints: Sprint[];
  onRemove: (id: string) => void;
  onUpdateRole: (id: string, role: "Admin" | "Miembro") => void;
  onDeleteCategory?: (category: string) => void;
  onDeleteSprint?: (sprintId: string) => void;
  onDeleteProject?: () => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"team" | "categories" | "sprints" | "danger">("team");
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'category' | 'sprint'; id: string } | null>(null);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-surface border border-border rounded-xl w-[520px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-6 border-b border-border flex justify-between items-center bg-panel">
          <div>
            <h2 className="text-lg font-bold text-text">Ajustes del Proyecto</h2>
            <p className="text-xs font-mono text-text-muted mt-1">{project.name}</p>
          </div>
          <button onClick={onClose} className="text-text-dim hover:text-text">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border bg-surface px-6 gap-2">
          <button
            onClick={() => setTab("team")}
            className={`py-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${tab === "team" ? "border-[#4f7cff] text-text font-bold" : "border-transparent text-text-muted hover:text-text"}`}
          >
            Equipo ({members.length})
          </button>
          <button
            onClick={() => setTab("categories")}
            className={`py-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${tab === "categories" ? "border-[#2dd67b] text-text font-bold" : "border-transparent text-text-muted hover:text-text"}`}
          >
            Categorías ({project.categories.length})
          </button>
          <button
            onClick={() => setTab("sprints")}
            className={`py-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${tab === "sprints" ? "border-[#9b6dff] text-text font-bold" : "border-transparent text-text-muted hover:text-text"}`}
          >
            Sprints ({sprints.length})
          </button>
          {onDeleteProject && (
            <button
              onClick={() => setTab("danger")}
              className={`py-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${tab === "danger" ? "border-[#ff5c6a] text-[#ff5c6a]" : "border-transparent text-text-muted hover:text-[#ff5c6a]"}`}
            >
              Zona de Peligro
            </button>
          )}
        </div>
        
        <div className="p-6 overflow-auto flex-1 min-h-[250px]">
          {tab === "team" && (
            <div className="space-y-3">
              {members.map(m => {
                const adminCount = members.filter((member) => member.role === "Admin").length;
                const isOnlyAdmin = m.role === "Admin" && adminCount <= 1;
                const isOnlyMember = members.length <= 1;
                return (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-panel">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: m.avatarColor }}>
                        {m.initials}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text">{m.name} {m.lastName}</p>
                        <p className="text-xs font-mono text-text-muted">@{m.username}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <select 
                        value={m.role} 
                        onChange={(e) => onUpdateRole(m.id, e.target.value as Member["role"])}
                        className="bg-transparent text-xs font-mono text-text-muted focus:outline-none cursor-pointer disabled:opacity-50"
                        disabled={isOnlyAdmin}
                        title={isOnlyAdmin ? "El proyecto debe conservar al menos un Administrador." : undefined}
                      >
                        <option value="Admin" className="bg-surface text-text">Admin</option>
                        <option value="Miembro" className="bg-surface text-text">Miembro</option>
                      </select>
                      <button 
                        onClick={() => onRemove(m.id)} 
                        className={`text-sm transition-colors ${isOnlyMember || isOnlyAdmin ? 'text-border cursor-not-allowed' : 'text-text-muted hover:text-[#ff5c6a]'}`}
                        title={isOnlyMember ? "No puedes eliminar al único integrante del proyecto." : isOnlyAdmin ? "No puedes eliminar al único Administrador." : "Quitar miembro"}
                        disabled={isOnlyMember || isOnlyAdmin}
                      >✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "categories" && (
            <div className="space-y-2">
              <p className="text-xs text-text-muted mb-3">Gestión de categorías del proyecto:</p>
              {project.categories.map((cat) => (
                <div key={cat} className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-panel">
                  <span className="text-xs font-mono text-text">{cat}</span>
                  {onDeleteCategory && (
                    <button
                      onClick={() => setConfirmDelete({ type: 'category', id: cat })}
                      className="text-text-muted hover:text-[#ff5c6a] transition-colors text-xs font-bold px-2 py-1"
                      title="Eliminar categoría"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === "sprints" && (
            <div className="space-y-2">
              <p className="text-xs text-text-muted mb-3">Gestión de Sprints del proyecto:</p>
              {sprints.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-panel">
                  <span className="text-xs font-mono text-text">{s.name}</span>
                  {onDeleteSprint && (
                    <button
                      onClick={() => setConfirmDelete({ type: 'sprint', id: s.id })}
                      className="text-text-muted hover:text-[#ff5c6a] transition-colors text-xs font-bold px-2 py-1"
                      title="Eliminar Sprint"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === "danger" && onDeleteProject && (
            <div className="p-4 border border-[#ff5c6a]/30 bg-[#ff5c6a]/5 rounded-lg space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#ff5c6a]">Eliminar este Proyecto</h4>
                <p className="text-xs text-text-muted mt-1">Esta acción borrará el proyecto y todas sus tareas asociadas. Esta acción no se puede deshacer.</p>
              </div>
              <button
                onClick={() => {
                  onDeleteProject();
                  onClose();
                }}
                className="w-full py-2 bg-[#ff5c6a] text-white text-xs font-bold rounded hover:bg-[#e04b58] transition-colors"
              >
                Eliminar Proyecto Definitivamente
              </button>
            </div>
          )}
        </div>
      </div>
      {confirmDelete && (
        <ConfirmModal
          title={confirmDelete.type === 'category' ? "Eliminar categoría" : "Eliminar sprint"}
          message={confirmDelete.type === 'category' ? "Se removerá la categoría de todas las tareas. ¿Continuar?" : "Se eliminará el sprint y sus referencias. ¿Continuar?"}
          confirmLabel="Sí, eliminar"
          onConfirm={() => {
            if (confirmDelete.type === 'category' && onDeleteCategory) onDeleteCategory(confirmDelete.id);
            if (confirmDelete.type === 'sprint' && onDeleteSprint) onDeleteSprint(confirmDelete.id);
            setConfirmDelete(null);
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
