import { useState } from "react";
import type { Project, Member, Sprint } from "../../../types";
import { getAccessibleColor } from "../../../constants/ui";
import { useIsDark } from "../../../context/ThemeContext";
import { ConfirmModal } from "../../shared/ConfirmModal";
import { Modal } from "../../shared/Modal";

export function SettingsModal({
  project,
  members,
  sprints,
  isAdmin = true,
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
  isAdmin?: boolean;
  onRemove: (id: string) => Promise<boolean> | boolean;
  onUpdateRole: (id: string, role: "Admin" | "Miembro") => Promise<boolean> | boolean;
  onDeleteCategory?: (category: string) => Promise<boolean> | boolean;
  onDeleteSprint?: (sprintId: string) => Promise<boolean> | boolean;
  onDeleteProject?: () => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"team" | "categories" | "sprints" | "danger">("team");
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'category' | 'sprint'; id: string } | null>(null);
  const [busyMemberId, setBusyMemberId] = useState<string | null>(null);
  const isDark = useIsDark();
  const activeTab = !isAdmin && tab === "danger" ? "team" : tab;

  async function handleRoleChange(memberId: string, role: Member["role"]) {
    if (!isAdmin || busyMemberId !== null) return;
    setBusyMemberId(memberId);
    try {
      await onUpdateRole(memberId, role);
    } finally {
      setBusyMemberId(null);
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!isAdmin || busyMemberId !== null) return;
    setBusyMemberId(memberId);
    try {
      await onRemove(memberId);
    } finally {
      setBusyMemberId(null);
    }
  }

  return (
    <>
      <Modal
        isOpen={true}
        onClose={onClose}
        titleId="settings-modal-title"
        maxWidthClass="max-w-[520px]"
        className="overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="p-6 border-b border-border flex justify-between items-center bg-panel">
          <div>
            <h2 id="settings-modal-title" className="text-lg font-bold text-text">Ajustes del Proyecto</h2>
            <p className="text-xs font-mono text-text-muted mt-1">{project.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ajustes"
            title="Cerrar ajustes"
            className="text-text-muted hover:text-text transition-colors p-1 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
          >
            ✕
          </button>
        </div>

        {/* Pestañas */}
        <div role="tablist" aria-label="Secciones de ajustes" className="flex border-b border-border bg-surface px-6 gap-2">
          <button
            type="button"
            role="tab"
            id="settings-tab-team"
            aria-controls="settings-tabpanel-team"
            aria-selected={activeTab === "team"}
            onClick={() => setTab("team")}
            className={`py-2.5 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${activeTab === "team" ? "border-accent-blue text-text font-bold" : "border-transparent text-text-muted hover:text-text"}`}
          >
            Equipo ({members.length})
          </button>
          <button
            type="button"
            role="tab"
            id="settings-tab-categories"
            aria-controls="settings-tabpanel-categories"
            aria-selected={activeTab === "categories"}
            onClick={() => setTab("categories")}
            className={`py-2.5 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${activeTab === "categories" ? "border-accent-green text-text font-bold" : "border-transparent text-text-muted hover:text-text"}`}
          >
            Categorías ({project.categories.length})
          </button>
          <button
            type="button"
            role="tab"
            id="settings-tab-sprints"
            aria-controls="settings-tabpanel-sprints"
            aria-selected={activeTab === "sprints"}
            onClick={() => setTab("sprints")}
            className={`py-2.5 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${activeTab === "sprints" ? "border-accent-violet text-text font-bold" : "border-transparent text-text-muted hover:text-text"}`}
          >
            Sprints ({sprints.length})
          </button>
          {isAdmin && onDeleteProject && (
            <button
              type="button"
              role="tab"
              id="settings-tab-danger"
              aria-controls="settings-tabpanel-danger"
              aria-selected={activeTab === "danger"}
              onClick={() => setTab("danger")}
              className={`py-2.5 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${activeTab === "danger" ? "border-accent-red text-accent-red" : "border-transparent text-text-muted hover:text-accent-red"}`}
            >
              Zona de Peligro
            </button>
          )}
        </div>

        <div
          role="tabpanel"
          id={`settings-tabpanel-${activeTab}`}
          aria-labelledby={`settings-tab-${activeTab}`}
          className="p-6 overflow-auto flex-1 min-h-[250px]"
        >
          {activeTab === "team" && (
            <div className="space-y-3">
              {members.map(m => {
                const adminCount = members.filter((member) => member.role === "Admin").length;
                const isOnlyAdmin = m.role === "Admin" && adminCount <= 1;
                const isOnlyMember = members.length <= 1;
                return (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-panel">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: getAccessibleColor(m.avatarColor, isDark) }}
                      >
                        {m.initials}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text">{m.name} {m.lastName}</p>
                        <p className="text-xs font-mono text-text-muted">@{m.username}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isAdmin ? (
                        <>
                          <select
                            value={m.role}
                            onChange={(e) => void handleRoleChange(m.id, e.target.value as Member["role"])}
                            aria-label={`Rol de ${m.name} ${m.lastName}`}
                            className="bg-transparent text-xs font-mono text-text-muted focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isOnlyAdmin || busyMemberId === m.id}
                            title={isOnlyAdmin ? "El proyecto debe conservar al menos un Administrador." : undefined}
                          >
                            <option value="Admin" className="bg-surface text-text">Admin</option>
                            <option value="Miembro" className="bg-surface text-text">Miembro</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => void handleRemoveMember(m.id)}
                            aria-label={`Quitar a ${m.name} ${m.lastName} del proyecto`}
                            className={`text-sm transition-colors p-1 rounded ${isOnlyMember || isOnlyAdmin || busyMemberId === m.id ? 'text-border cursor-not-allowed' : 'text-text-muted hover:text-accent-red cursor-pointer'} disabled:cursor-not-allowed`}
                            title={isOnlyMember ? "No puedes eliminar al único integrante del proyecto." : isOnlyAdmin ? "No puedes eliminar al único Administrador." : "Quitar miembro"}
                            disabled={isOnlyMember || isOnlyAdmin || busyMemberId === m.id}
                          >✕</button>
                        </>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
                            m.role === "Admin"
                              ? "bg-accent-blue/10 text-accent-blue border-accent-blue/30"
                              : "bg-surface text-text-muted border-border"
                          }`}
                        >
                          {m.role}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "categories" && (
            <div className="space-y-2">
              <p className="text-xs text-text-muted mb-3">
                {isAdmin ? "Gestión de categorías del proyecto:" : "Categorías del proyecto:"}
              </p>
              {project.categories.map((cat) => (
                <div key={cat} className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-panel">
                  <span className="text-xs font-mono text-text">{cat}</span>
                  {isAdmin && onDeleteCategory && (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete({ type: 'category', id: cat })}
                      className="text-text-muted hover:text-accent-red transition-colors text-xs font-bold px-2 py-1 cursor-pointer"
                      title={`Eliminar categoría ${cat}`}
                      aria-label={`Eliminar categoría ${cat}`}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === "sprints" && (
            <div className="space-y-2">
              <p className="text-xs text-text-muted mb-3">
                {isAdmin ? "Gestión de Sprints del proyecto:" : "Sprints del proyecto:"}
              </p>
              {sprints.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-panel">
                  <span className="text-xs font-mono text-text">{s.name}</span>
                  {isAdmin && onDeleteSprint && (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete({ type: 'sprint', id: s.id })}
                      className="text-text-muted hover:text-accent-red transition-colors text-xs font-bold px-2 py-1 cursor-pointer"
                      title={`Eliminar sprint ${s.name}`}
                      aria-label={`Eliminar sprint ${s.name}`}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === "danger" && isAdmin && onDeleteProject && (
            <div className="p-4 border border-accent-red/30 bg-accent-red/5 rounded-lg space-y-4">
              <div>
                <h4 className="text-sm font-bold text-accent-red">Eliminar este Proyecto</h4>
                <p className="text-xs text-text-muted mt-1">Esta acción borrará el proyecto y todas sus tareas asociadas. Esta acción no se puede deshacer.</p>
              </div>
              <button
                type="button"
                onClick={onDeleteProject}
                className="w-full py-2 bg-accent-red text-white text-xs font-bold rounded hover:opacity-90 transition-colors cursor-pointer"
              >
                Eliminar Proyecto Definitivamente
              </button>
            </div>
          )}
        </div>
      </Modal>

      {isAdmin && confirmDelete && (
        <ConfirmModal
          title={confirmDelete.type === 'category' ? "Eliminar categoría" : "Eliminar sprint"}
          message={confirmDelete.type === 'category' ? "Se removerá la categoría de todas las tareas. ¿Continuar?" : "Se eliminará el sprint y sus referencias. ¿Continuar?"}
          confirmLabel="Sí, eliminar"
          onConfirm={async () => {
            const ok =
              confirmDelete.type === 'category'
                ? (onDeleteCategory ? await onDeleteCategory(confirmDelete.id) : true)
                : (onDeleteSprint ? await onDeleteSprint(confirmDelete.id) : true);
            if (ok) {
              setConfirmDelete(null);
            }
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </>
  );
}
