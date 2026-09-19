import { useState } from "react";
import type { Priority, Status } from "./types/activities";
import { ALL_USERS, PRIORITY_META, STATUS_META } from "./data/mockScrum";
import { TaskRow } from "./components/scrum/TaskRow";
import { AddRowForm } from "./components/scrum/AddRowForm";
import { NewProjectModal } from "./components/scrum/modals/NewProjectModal";
import { InviteModal } from "./components/scrum/modals/InviteModal";
import { SettingsModal } from "./components/scrum/modals/SettingsModal";
import { StatsModal } from "./components/scrum/StatsModal";
import { ConfirmModal } from "./components/shared/ConfirmModal";
import { useScrumBoard } from "./hooks/useScrumBoard";

export function ScrumView() {
  const {
    projects,
    activeProjectId,
    allSprints,
    project,
    setActiveProjectId,
    handleUpdateTask,
    handleAddTask,
    handleDeleteTask,
    handleAddCategory,
    handleDeleteCategory,
    handleAddSprint,
    handleDeleteSprint,
    handleDeleteProject,
    createProject,
    inviteMember,
    removeMember,
    updateMemberRole,
  } = useScrumBoard();

  const [showNewRow, setShowNewRow] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'task' | 'project'; id: string } | null>(null);

  const doneCount = project?.tasks.filter((t) => t.status === "Completada").length || 0;
  const totalCount = project?.tasks.length || 0;
  const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;



  if (!project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-white bg-[#0d0f14]">
        <p className="text-[#7c82a0] mb-4">No hay proyectos actualmente.</p>
        <button
          onClick={() => setShowNewProject(true)}
          className="px-4 py-2 bg-[#4f7cff] text-white rounded-md text-sm font-medium hover:bg-[#3d6ae0] transition-colors"
        >
          + Crear Proyecto
        </button>
        {showNewProject && <NewProjectModal onCreate={(proj) => { createProject(proj); setShowNewProject(false); }} onClose={() => setShowNewProject(false)} />}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0d0f14] overflow-hidden text-[#e8eaf2]">
      {/* Header */}
      <header className="px-6 py-4 flex flex-col gap-4 border-b border-[#2a2f45] bg-[#151820]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActiveProjectId(p.id)}
                  className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-all border ${
                    p.id === activeProjectId
                      ? "bg-[#2a2f45] text-white"
                      : "border-transparent text-[#7c82a0] hover:text-[#e8eaf2] hover:bg-[#1c2030]"
                  }`}
                  style={p.id === activeProjectId ? { borderColor: p.color } : {}}
                >
                  <span className="w-2 h-2 rounded-full inline-block mr-2" style={{ backgroundColor: p.color }} />
                  {p.name}
                </button>
              ))}
              <button
                onClick={() => setShowNewProject(true)}
                className="px-2.5 py-1.5 rounded-md text-[13px] text-[#4f7cff] hover:bg-[#4f7cff]/10 transition-colors flex items-center gap-1 font-medium"
              >
                <span>+</span> Proyecto
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowStats(true)} className="p-1.5 rounded hover:bg-[#2a2f45] text-[#7c82a0] hover:text-[#4f7cff] transition-colors" title="Estadísticas">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
            </button>
            <button onClick={() => setShowSettings(true)} className="p-1.5 rounded hover:bg-[#2a2f45] text-[#7c82a0] transition-colors" title="Ajustes del proyecto">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            </button>
          </div>
        </div>

        <div className="flex items-end justify-between mt-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            <p className="text-sm text-[#7c82a0] mt-1">{project.description}</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end gap-1.5">
              <span className="text-[10px] font-mono text-[#7c82a0] tracking-wider uppercase">Progreso</span>
              <div className="flex items-center gap-3">
                <div className="w-32 h-1.5 bg-[#1c2030] rounded-full overflow-hidden">
                  <div className="h-full transition-all duration-500 rounded-full" style={{ width: `${progress}%`, backgroundColor: project.color }} />
                </div>
                <span className="text-[11px] font-mono text-[#e8eaf2]">{Math.round(progress)}%</span>
              </div>
            </div>
            <div className="h-8 w-px bg-[#2a2f45]"></div>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {project.members.map((m) => (
                  <div key={m.id} className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-[#151820]" style={{ backgroundColor: m.avatarColor }} title={`${m.name} (${m.role})`}>
                    {m.initials}
                  </div>
                ))}
              </div>
              <button onClick={() => setShowInvite(true)} className="w-7 h-7 rounded-full border border-dashed border-[#4a5070] flex items-center justify-center text-[#7c82a0] hover:border-[#4f7cff] hover:text-[#4f7cff] transition-colors" title="Invitar al equipo">
                +
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Spreadsheet */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-[12px]" style={{ minWidth: 1100 }}>
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#151820] border-b border-[#2a2f45]">

              {[
                { key: "title", label: "TAREA", w: "280px" },
                { key: "sprintId", label: "SPRINT", w: "130px" },
                { key: "category", label: "CATEGORÍA", w: "130px" },
                { key: "members", label: "RESPONSABLE", w: "140px" },
                { key: "priority", label: "PRIORIDAD", w: "110px" },
                { key: "status", label: "ESTADO", w: "130px" },
                { key: "hours", label: "HORAS", w: "70px" },
                { key: "dueDate", label: "DEADLINE", w: "110px" },
                { key: "description", label: "NOTAS", w: "auto" },
              ].map((col) => (
                <th
                  key={col.key}
                  className="px-3 py-2.5 text-left border-r border-[#2a2f45] font-mono font-medium text-[10px] text-[#4a5070] tracking-wider whitespace-nowrap"
                  style={{ width: col.w, minWidth: col.w === "auto" ? 160 : col.w }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {project.tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                project={project}
                ALL_SPRINTS={allSprints}
                PRIORITY_META={PRIORITY_META}
                STATUS_META={STATUS_META}
                onUpdate={handleUpdateTask}
                onDeleteTask={(id) => setConfirmDelete({ type: 'task', id })}
                onCreateCategory={handleAddCategory}
                onCreateSprint={handleAddSprint}
              />
            ))}
            {showNewRow && (
              <AddRowForm
                project={project}
                ALL_SPRINTS={allSprints}
                PRIORITIES={Object.keys(PRIORITY_META) as Priority[]}
                STATUSES={Object.keys(STATUS_META) as Status[]}
                onAdd={(t) => { handleAddTask(t); setShowNewRow(false); }}
                onCreateCategory={handleAddCategory}
                onCreateSprint={handleAddSprint}
                onCancel={() => setShowNewRow(false)}
              />
            )}
            {!showNewRow && (
              <tr>
                <td colSpan={10} className="p-0">
                  <button onClick={() => setShowNewRow(true)} className="w-full py-2.5 flex items-center justify-center gap-2 text-[11px] font-mono text-[#4a5070] hover:text-[#4f7cff] hover:bg-[#4f7cff]/5 transition-all border-b border-[#2a2f45]">
                    <span>+</span> Añadir tarea
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showNewProject && <NewProjectModal onCreate={(proj) => { createProject(proj); setShowNewProject(false); }} onClose={() => setShowNewProject(false)} />}
      {showInvite && <InviteModal ALL_USERS={ALL_USERS} project={project} onInvite={(m) => { inviteMember(m); setShowInvite(false); }} onClose={() => setShowInvite(false)} />}
      {showStats && <StatsModal project={project} onClose={() => setShowStats(false)} />}
      {showSettings && (
        <SettingsModal
          project={project}
          onClose={() => setShowSettings(false)}
          onRemove={removeMember}
          onUpdateRole={updateMemberRole}
          onDeleteCategory={handleDeleteCategory}
          onDeleteSprint={handleDeleteSprint}
          onDeleteProject={() => setConfirmDelete({ type: 'project', id: project.id })}
        />
      )}
      {confirmDelete && (
        <ConfirmModal
          title={confirmDelete.type === 'task' ? "Eliminar tarea" : "Eliminar proyecto"}
          message="Esta acción no se puede deshacer."
          confirmLabel="Sí, eliminar"
          onConfirm={() => {
            if (confirmDelete.type === 'task') {
              handleDeleteTask(confirmDelete.id);
            } else {
              handleDeleteProject(confirmDelete.id);
              setShowSettings(false);
            }
            setConfirmDelete(null);
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}