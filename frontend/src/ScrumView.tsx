import { useCallback, useEffect, useState } from "react";
import { TaskRow } from "./components/scrum/TaskRow";
import { AddRowForm } from "./components/scrum/AddRowForm";
import { NewProjectModal } from "./components/scrum/modals/NewProjectModal";
import { InviteModal } from "./components/scrum/modals/InviteModal";
import { SettingsModal } from "./components/scrum/modals/SettingsModal";
import { StatsModal } from "./components/scrum/StatsModal";
import { ConfirmModal } from "./components/shared/ConfirmModal";
import { ProjectLinksBar } from "./components/scrum/ProjectLinksBar";
import { ProjectLinkModal } from "./components/scrum/modals/ProjectLinkModal";
import { useScrumBoard } from "./hooks/useScrumBoard";
import { useToastStore } from "./store/useToastStore";
import { Loading, ErrorBox } from "./components/shared/Feedback";
import type { ProjectLink } from "./types";

export function ScrumView() {
  const {
    projects,
    users,
    loading,
    error,
    mutationError,
    clearMutationError,
    refetch,
    activeProjectId,
    isAdmin,
    project,
    projectSprints,
    projectTasks,
    projectMembers,
    setActiveProjectId,
    updateTask,
    addTask,
    deleteTask,
    reorderTasks,
    addCategory,
    deleteCategory,
    addSprint,
    deleteSprint,
    deleteProject,
    createProject,
    inviteMember,
    removeMember,
    updateMemberRole,
    addProjectLink,
    deleteProjectLink,
    updateProjectLink,
  } = useScrumBoard();

  const [showNewRow, setShowNewRow] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [editingLink, setEditingLink] = useState<ProjectLink | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'task' | 'project'; id: string } | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  // Id de la tarea que se esta arrastrando con el dedo (null si no hay).
  const [touchDragId, setTouchDragId] = useState<string | null>(null);
  const showError = useToastStore((s) => s.showError);

  useEffect(() => {
    if (!mutationError) return;
    showError(`Error al guardar cambios: ${mutationError}`, {
      tag: "scrum-mutation-error",
    });
    clearMutationError();
  }, [mutationError, showError, clearMutationError]);

  /** Devuelve los ids del tablero con la tarea movida a la posicion `to`. */
  const idsWithMove = useCallback(
    (taskId: string, to: number): string[] | null => {
      const ids = projectTasks.map((t) => t.id);
      const from = ids.indexOf(taskId);
      if (from === -1 || to < 0 || to >= ids.length || to === from) return null;
      const [moved] = ids.splice(from, 1);
      ids.splice(to, 0, moved);
      return ids;
    },
    [projectTasks]
  );

  /** Suelta la tarea arrastrada en la posicion de la tarea destino. */
  const handleDropOn = useCallback(
    (targetId: string, draggedTaskId: string) => {
      setDropTargetId(null);
      setDraggingTaskId(null);
      const dragged = draggedTaskId || draggingTaskId;
      if (!dragged || dragged === targetId) return;
      const ids = idsWithMove(dragged, projectTasks.findIndex((t) => t.id === targetId));
      if (ids) reorderTasks(ids);
    },
    [draggingTaskId, idsWithMove, projectTasks, reorderTasks]
  );

  /** Mueve la tarea una posicion arriba o abajo, desde el teclado. */
  function handleMoveBy(taskId: string, delta: number) {
    const from = projectTasks.findIndex((t) => t.id === taskId);
    const ids = idsWithMove(taskId, from + delta);
    if (ids) reorderTasks(ids);
  }

  /**
   * Arrastre con el dedo. En pantallas tactiles el navegador no emite
   * dragstart/drop, asi que mientras el dedo este abajo seguimos el puntero
   * y miramos sobre que fila esta para resaltarla y, al soltar, moverla.
   */
  useEffect(() => {
    if (!touchDragId) return;

    function taskIdAt(x: number, y: number): string | null {
      const element = document.elementFromPoint(x, y);
      const row = element?.closest<HTMLElement>("tr[data-task-id]");
      return row?.dataset.taskId ?? null;
    }

    function handlePointerMove(e: PointerEvent) {
      // Evita que la pagina haga scroll mientras se arrastra la fila.
      e.preventDefault();
      const overId = taskIdAt(e.clientX, e.clientY);
      setDropTargetId(overId && overId !== touchDragId ? overId : null);
    }

    function handlePointerUp(e: PointerEvent) {
      const targetId = taskIdAt(e.clientX, e.clientY);
      const dragged = touchDragId;
      setTouchDragId(null);
      if (targetId && dragged) {
        handleDropOn(targetId, dragged);
      } else {
        setDraggingTaskId(null);
        setDropTargetId(null);
      }
    }

    function handlePointerCancel() {
      setTouchDragId(null);
      setDraggingTaskId(null);
      setDropTargetId(null);
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
    };
  }, [touchDragId, handleDropOn]);

  const doneCount = projectTasks.filter((t) => t.status === "Completada").length;
  const totalCount = projectTasks.length;
  const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;

  if (loading) return <Loading label="Cargando proyectos..." />;
  if (error) return <ErrorBox message={error} onRetry={refetch} />;

  if (!project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-text bg-background">
        {mutationError && (
          <div className="mb-4" role="alert">
            <p className="text-sm text-red-500">
              {mutationError}
            </p>
            <button
              type="button"
              onClick={clearMutationError}
              className="mt-2 text-sm underline cursor-pointer"
            >
              Cerrar aviso
            </button>
          </div>
        )}
        <p className="text-text-muted mb-4">No hay proyectos actualmente.</p>
        <button
          onClick={() => setShowNewProject(true)}
          className="px-4 py-2 bg-accent-blue text-white rounded-md text-sm font-medium hover:opacity-90 transition-colors"
        >
          + Crear Proyecto
        </button>
        {showNewProject && (
          <NewProjectModal
            onCreate={createProject}
            onClose={() => setShowNewProject(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-surface overflow-hidden text-text">
      {/* Header */}
      <header className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col gap-3 sm:gap-4 border-b border-border bg-surface shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-4 min-w-0">
            {/* En movil las pestañas de proyecto se desplazan en horizontal */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setActiveProjectId(p.id);
                    setShowNewRow(false);
                  }}
                  className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-all border whitespace-nowrap shrink-0 ${
                    p.id === activeProjectId
                      ? "bg-panel text-text"
                      : "border-transparent text-text-muted hover:text-text hover:bg-panel-hover"
                  }`}
                  style={p.id === activeProjectId ? { borderColor: p.color } : {}}
                >
                  <span className="w-2 h-2 rounded-full inline-block mr-2" style={{ backgroundColor: p.color }} />
                  {p.name}
                </button>
              ))}
              <button
                onClick={() => setShowNewProject(true)}
                className="px-2.5 py-1.5 rounded-md text-[13px] text-accent-blue hover:bg-accent-blue/10 transition-colors flex items-center gap-1 font-medium whitespace-nowrap shrink-0"
              >
                <span>+</span> Proyecto
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setShowStats(true)} className="p-1.5 rounded hover:bg-panel-hover text-text-muted hover:text-accent-blue transition-colors" title="Estadísticas">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
            </button>
            <button onClick={() => setShowSettings(true)} className="p-1.5 rounded hover:bg-panel-hover text-text-muted transition-colors" title="Ajustes del proyecto">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-1 sm:mt-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{project.name}</h1>
            <p className="text-sm text-text-muted mt-1">{project.description}</p>
          </div>
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
            <div className="flex flex-col items-end gap-1.5">
              <span className="text-[10px] font-mono text-text-muted tracking-wider uppercase">Progreso</span>
              <div className="flex items-center gap-3">
                <div className="w-32 h-1.5 bg-panel rounded-full overflow-hidden">
                  <div className="h-full transition-all duration-500 rounded-full" style={{ width: `${progress}%`, backgroundColor: project.color }} />
                </div>
                <span className="text-[11px] font-mono text-text">{Math.round(progress)}%</span>
              </div>
            </div>
            <div className="hidden sm:block h-8 w-px bg-border"></div>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {projectMembers.map((m) => (
                  <div key={m.id} className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-surface" style={{ backgroundColor: m.avatarColor }} title={`${m.name} (${m.role})`}>
                    {m.initials}
                  </div>
                ))}
              </div>
              {isAdmin && (
                <button onClick={() => setShowInvite(true)} className="w-7 h-7 rounded-full border border-dashed border-text-muted flex items-center justify-center text-text-muted hover:border-accent-blue hover:text-accent-blue transition-colors" title="Invitar al equipo">
                  +
                </button>
              )}
            </div>
          </div>
        </div>

        {(isAdmin || (project.links && project.links.length > 0)) && (
          <div className="pt-1">
            <ProjectLinksBar
              links={project.links || []}
              canEdit={isAdmin}
              onAddLink={() => {
                setEditingLink(null);
                setShowLinkModal(true);
              }}
              onEditLink={(link) => {
                setEditingLink(link);
                setShowLinkModal(true);
              }}
              onDeleteLink={(linkId) => {
                void deleteProjectLink(linkId);
              }}
            />
          </div>
        )}
      </header>

      {/* Spreadsheet */}
      <div className="flex-1 overflow-auto bg-surface">
        <table className="w-full border-collapse text-[12px]" style={{ minWidth: 1100 }}>
          <thead className="sticky top-0 z-10">
            <tr className="bg-surface border-b border-border">

              {[
                { key: "drag", label: "", w: "44px" },
                { key: "title", label: "TAREA", w: "280px" },
                { key: "sprintId", label: "SPRINT", w: "130px" },
                { key: "category", label: "CATEGORÍA", w: "130px" },
                { key: "members", label: "RESPONSABLE", w: "140px" },
                { key: "priority", label: "PRIORIDAD", w: "110px" },
                { key: "status", label: "ESTADO", w: "130px" },
                { key: "hours", label: "HORAS", w: "85px" },
                { key: "dueDate", label: "DEADLINE", w: "175px", align: "right" },
                { key: "description", label: "NOTAS", w: "auto" },
              ].map((col) => (
                <th
                  key={col.key}
                  className={`px-3 py-2.5 ${col.align === "right" ? "text-right" : "text-left"} border-r border-border font-mono font-semibold text-[10px] text-text-muted tracking-wider uppercase whitespace-nowrap bg-panel/60`}
                  style={{ width: col.w, minWidth: col.w === "auto" ? 160 : col.w }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projectTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                sprints={projectSprints}
                members={projectMembers}
                categories={project.categories}
                onUpdate={updateTask}
                onDeleteTask={(id) => setConfirmDelete({ type: 'task', id })}
                onCreateCategory={isAdmin ? addCategory : undefined}
                onCreateSprint={isAdmin ? addSprint : undefined}
                isDragging={draggingTaskId === task.id}
                isDropTarget={dropTargetId === task.id && draggingTaskId !== task.id}
                onDragStartTask={() => setDraggingTaskId(task.id)}
                onDragEnterTask={() => setDropTargetId(task.id)}
                onDropTask={(draggedTaskId) => handleDropOn(task.id, draggedTaskId)}
                onDragEndTask={() => {
                  setDraggingTaskId(null);
                  setDropTargetId(null);
                }}
                onTouchDragStart={() => {
                  setTouchDragId(task.id);
                  setDraggingTaskId(task.id);
                }}
                onMoveTask={(delta) => handleMoveBy(task.id, delta)}
              />
            ))}
            {showNewRow && (
              <AddRowForm
                key={project.id}
                sprints={projectSprints}
                members={projectMembers}
                categories={project.categories}
                onAdd={async (t) => {
                  const created = await addTask(t);
                  if (created) setShowNewRow(false);
                  return created;
                }}
                onCreateCategory={isAdmin ? addCategory : undefined}
                onCreateSprint={isAdmin ? addSprint : undefined}
                onCancel={() => setShowNewRow(false)}
              />
            )}
            {!showNewRow && (
              <tr>
                <td colSpan={10} className="p-0">
                  <button onClick={() => setShowNewRow(true)} className="w-full py-2.5 flex items-center justify-center gap-2 text-[11px] font-mono text-text-muted hover:text-accent-blue hover:bg-accent-blue/5 transition-all border-b border-border">
                    <span>+</span> Añadir tarea
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showNewProject && (
        <NewProjectModal
          onCreate={createProject}
          onClose={() => setShowNewProject(false)}
        />
      )}
      {isAdmin && showInvite && (
        <InviteModal
          users={users}
          members={projectMembers}
          onInvite={async (u) => {
            const ok = await inviteMember(u);
            if (ok) setShowInvite(false);
            return ok;
          }}
          onClose={() => setShowInvite(false)}
        />
      )}
      {showStats && <StatsModal project={project} tasks={projectTasks} members={projectMembers} onClose={() => setShowStats(false)} />}
      {showSettings && (
        <SettingsModal
          project={project}
          members={projectMembers}
          sprints={projectSprints}
          isAdmin={isAdmin}
          onClose={() => setShowSettings(false)}
          onRemove={removeMember}
          onUpdateRole={updateMemberRole}
          onDeleteCategory={deleteCategory}
          onDeleteSprint={deleteSprint}
          onDeleteProject={
            isAdmin ? () => setConfirmDelete({ type: 'project', id: project.id }) : undefined
          }
        />
      )}
      {confirmDelete && (
        <ConfirmModal
          title={confirmDelete.type === 'task' ? "Eliminar tarea" : "Eliminar proyecto"}
          message="Esta acción no se puede deshacer."
          confirmLabel="Sí, eliminar"
          onConfirm={async () => {
            if (confirmDelete.type === "task") {
              const ok = await deleteTask(confirmDelete.id);
              if (ok) setConfirmDelete(null);
              return;
            }
            const ok = await deleteProject(confirmDelete.id);
            if (ok) {
              setShowSettings(false);
              setConfirmDelete(null);
            }
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      {isAdmin && showLinkModal && (
        <ProjectLinkModal
          key={editingLink?.id ?? "new"}
          isOpen={showLinkModal}
          linkToEdit={editingLink}
          onClose={() => {
            setShowLinkModal(false);
            setEditingLink(null);
          }}
          onSave={(link) => {
            if (editingLink) {
              return updateProjectLink(editingLink.id, link);
            }
            return addProjectLink(link);
          }}
        />
      )}
    </div>
  );
}