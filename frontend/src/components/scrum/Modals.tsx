import { useState } from "react";
import type { Project } from "../../types/projects";
import type { User, Member } from "../../types/users";
import { COLORS } from "../../data/mockScrum";

export function NewProjectModal({
  onCreate,
  onClose,
}: {
  onCreate: (p: Omit<Project, "id" | "tasks" | "sprints" | "categories" | "members">) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [course, setCourse] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  return (
    <div className="fixed inset-0 bg-[#0d0f14]/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#151820] border border-[#2a2f45] rounded-xl p-6 w-[400px] shadow-2xl">
        <h2 className="text-lg font-bold text-white mb-6">Nuevo Proyecto</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-[#7c82a0] mb-1.5 uppercase">Nombre</label>
            <input autoFocus value={name} onChange={e => setName(e.target.value)} className="w-full bg-[#0d0f14] border border-[#2a2f45] rounded-md px-3 py-2 text-sm text-[#e8eaf2] focus:outline-none focus:border-[#4f7cff] transition-colors" placeholder="Ej: Sistema de Biblioteca" />
          </div>
          <div>
            <label className="block text-xs font-mono text-[#7c82a0] mb-1.5 uppercase">Ramo (Opcional)</label>
            <input value={course} onChange={e => setCourse(e.target.value)} className="w-full bg-[#0d0f14] border border-[#2a2f45] rounded-md px-3 py-2 text-sm text-[#e8eaf2] focus:outline-none focus:border-[#4f7cff] transition-colors" placeholder="Ej: IIC2143" />
          </div>
          <div>
            <label className="block text-xs font-mono text-[#7c82a0] mb-2 uppercase">Color</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)} className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${color === c ? "ring-2 ring-white ring-offset-2 ring-offset-[#151820]" : ""}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-md text-sm font-medium text-[#7c82a0] hover:bg-[#2a2f45] hover:text-[#e8eaf2] transition-colors">Cancelar</button>
          <button onClick={() => { if (!name.trim()) return; onCreate({ name, course, color, description: "" }); }} className="flex-1 px-4 py-2 bg-[#4f7cff] text-white rounded-md text-sm font-medium hover:bg-[#3d6ae0] transition-colors">Crear Proyecto</button>
        </div>
      </div>
    </div>
  );
}

export function InviteModal({
  ALL_USERS,
  project,
  onInvite,
  onClose,
}: {
  ALL_USERS: User[];
  project: Project;
  onInvite: (m: User) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  
  const availableUsers = ALL_USERS.filter(u => 
    !project.members.some(m => m.id === u.id) &&
    (u.name.toLowerCase().includes(search.toLowerCase()) || u.username.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 bg-[#0d0f14]/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#151820] border border-[#2a2f45] rounded-xl p-6 w-[400px] shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-white">Invitar al equipo</h2>
          <button onClick={onClose} className="text-[#4a5070] hover:text-[#e8eaf2]">✕</button>
        </div>
        
        <input autoFocus value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-[#0d0f14] border border-[#2a2f45] rounded-md px-3 py-2 text-sm text-[#e8eaf2] focus:outline-none focus:border-[#4f7cff] transition-colors mb-4" placeholder="Buscar por nombre o usuario..." />

        <div className="space-y-2 max-h-[300px] overflow-auto">
          {availableUsers.map(u => (
            <div key={u.id} className="flex items-center justify-between p-2 rounded-md hover:bg-[#2a2f45] transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: u.avatarColor }}>
                  {u.initials}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#e8eaf2]">{u.name} {u.lastName}</p>
                  <p className="text-xs font-mono text-[#7c82a0]">@{u.username}</p>
                </div>
              </div>
              <button onClick={() => onInvite(u)} className="px-3 py-1 bg-[#4f7cff]/10 text-[#4f7cff] rounded text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#4f7cff]/20">
                Añadir
              </button>
            </div>
          ))}
          {availableUsers.length === 0 && <p className="text-center text-[#7c82a0] text-sm py-4">No se encontraron usuarios</p>}
        </div>
      </div>
    </div>
  );
}

export function SettingsModal({
  project,
  onRemove,
  onUpdateRole,
  onDeleteCategory,
  onDeleteSprint,
  onDeleteProject,
  onClose,
}: {
  project: Project;
  onRemove: (id: number) => void;
  onUpdateRole: (id: number, role: Member["role"]) => void;
  onDeleteCategory?: (category: string) => void;
  onDeleteSprint?: (sprintId: number) => void;
  onDeleteProject?: () => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"team" | "categories" | "sprints" | "danger">("team");

  return (
    <div className="fixed inset-0 bg-[#0d0f14]/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#151820] border border-[#2a2f45] rounded-xl w-[520px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-6 border-b border-[#2a2f45] flex justify-between items-center bg-[#1c2030]">
          <div>
            <h2 className="text-lg font-bold text-white">Ajustes del Proyecto</h2>
            <p className="text-xs font-mono text-[#7c82a0] mt-1">{project.name}</p>
          </div>
          <button onClick={onClose} className="text-[#4a5070] hover:text-[#e8eaf2]">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#2a2f45] bg-[#151820] px-6 gap-2">
          <button
            onClick={() => setTab("team")}
            className={`py-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${tab === "team" ? "border-[#4f7cff] text-white" : "border-transparent text-[#7c82a0] hover:text-[#e8eaf2]"}`}
          >
            Equipo ({project.members.length})
          </button>
          <button
            onClick={() => setTab("categories")}
            className={`py-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${tab === "categories" ? "border-[#2dd67b] text-white" : "border-transparent text-[#7c82a0] hover:text-[#e8eaf2]"}`}
          >
            Categorías ({project.categories.length})
          </button>
          <button
            onClick={() => setTab("sprints")}
            className={`py-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${tab === "sprints" ? "border-[#9b6dff] text-white" : "border-transparent text-[#7c82a0] hover:text-[#e8eaf2]"}`}
          >
            Sprints ({project.sprints.length})
          </button>
          {onDeleteProject && (
            <button
              onClick={() => setTab("danger")}
              className={`py-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${tab === "danger" ? "border-[#ff5c6a] text-[#ff5c6a]" : "border-transparent text-[#7c82a0] hover:text-[#ff5c6a]"}`}
            >
              Zona de Peligro
            </button>
          )}
        </div>
        
        <div className="p-6 overflow-auto flex-1 min-h-[250px]">
          {tab === "team" && (
            <div className="space-y-3">
              {project.members.map(m => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border border-[#2a2f45] bg-[#0d0f14]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: m.avatarColor }}>
                      {m.initials}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#e8eaf2]">{m.name} {m.lastName}</p>
                      <p className="text-xs font-mono text-[#7c82a0]">@{m.username}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <select 
                      value={m.role} 
                      onChange={(e) => onUpdateRole(m.id, e.target.value as Member["role"])}
                      className="bg-transparent text-xs font-mono text-[#7c82a0] focus:outline-none cursor-pointer"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Miembro">Miembro</option>
                    </select>
                    <button onClick={() => onRemove(m.id)} className="text-[#2a2f45] hover:text-[#ff5c6a] transition-colors text-sm" title="Quitar miembro">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "categories" && (
            <div className="space-y-2">
              <p className="text-xs text-[#7c82a0] mb-3">Gestión de categorías del proyecto:</p>
              {project.categories.map((cat) => (
                <div key={cat} className="flex items-center justify-between p-2.5 rounded-lg border border-[#2a2f45] bg-[#0d0f14]">
                  <span className="text-xs font-mono text-[#e8eaf2]">{cat}</span>
                  {onDeleteCategory && (
                    <button
                      onClick={() => onDeleteCategory(cat)}
                      className="text-[#7c82a0] hover:text-[#ff5c6a] transition-colors text-xs font-bold px-2 py-1"
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
              <p className="text-xs text-[#7c82a0] mb-3">Gestión de Sprints del proyecto:</p>
              {project.sprints.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-2.5 rounded-lg border border-[#2a2f45] bg-[#0d0f14]">
                  <span className="text-xs font-mono text-[#e8eaf2]">{s.name}</span>
                  {onDeleteSprint && (
                    <button
                      onClick={() => onDeleteSprint(s.id)}
                      className="text-[#7c82a0] hover:text-[#ff5c6a] transition-colors text-xs font-bold px-2 py-1"
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
                <p className="text-xs text-[#7c82a0] mt-1">Esta acción borrará el proyecto y todas sus tareas asociadas. Esta acción no se puede deshacer.</p>
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
    </div>
  );
}