import { useState } from "react";
import { CATEGORY_COLORS, TASK_TYPES } from "./constants/ui";
import type { OrganizerTask, TaskType } from "./types";
import { getToday, type ViewTab, type TimeFilter } from "./utils/dateUtils";
import { useOrganizerBoard } from "./hooks/useOrganizerBoard";
import { CourseTab } from "./components/organizer/CourseTab";
import { StatPill } from "./components/organizer/StatPill";
import { OrganizerTaskRow } from "./components/organizer/OrganizerTaskRow";
import { WeekScheduleView } from "./components/organizer/WeekScheduleView";
import { MonthScheduleView } from "./components/organizer/MonthScheduleView";
import { ManageCoursesModal } from "./components/organizer/modals/ManageCoursesModal";
import { AddOrganizerTaskModal } from "./components/organizer/modals/AddOrganizerTaskModal";
import { ConfirmModal } from "./components/shared/ConfirmModal";
import { Loading, ErrorBox, Toast } from "./components/shared/Feedback";


export default function OrganizerView() {
  const {
    courses,
    sessions,
    activeCourse,
    setActiveCourse,
    timeFilter,
    setTimeFilter,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    tab,
    setTab,
    filteredTasks,
    sortedTasks,
    loading,
    error,
    toggleTaskStatus,
    setTaskStatus,
    deleteTask,
    addTask,
    addCourse,
    deleteCourse,
    addSession,
    deleteSession,
    allCourseStats,
    scopedTasks,
    doneCount,
    totalCount,
    activeCourseObj,
  } = useOrganizerBoard();

  const today = getToday();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showManageCourses, setShowManageCourses] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; taskId: string; previousStatus: OrganizerTask["status"] }>>([]);

  function handleToggleStatus(task: OrganizerTask) {
    const previousStatus = task.status;
    const nextStatus = toggleTaskStatus(task.id);
    if (nextStatus === "Completada") {
      const toastId = Math.random().toString(36).substring(2, 9);
      setToasts(prev => [...prev, {
        id: toastId,
        message: `"${task.title}" marcada como lista`,
        taskId: task.id,
        previousStatus,
      }]);
    } else {
      setToasts(prev => prev.filter(t => t.taskId !== task.id));
    }
  }

  function handleUndo(toastId: string, taskId: string, previousStatus: OrganizerTask["status"]) {
    setTaskStatus(taskId, previousStatus);
    setToasts(prev => prev.filter(t => t.id !== toastId));
  }

  if (loading) return <Loading label="Cargando organizador..." />;
  if (error) return <ErrorBox message={error} />;

  return (
    <div className="flex h-full overflow-hidden text-text">
      {/* Course sidebar */}
      <div className="w-56 flex-shrink-0 border-r border-border bg-surface flex flex-col">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="text-[10px] font-mono font-medium uppercase tracking-widest text-text-dim">Mis Ramos</span>
          <button
            onClick={() => setShowManageCourses(true)}
            className="text-[10px] font-mono text-text-dim hover:text-[#4f7cff] transition-colors"
            title="Gestionar ramos y horarios"
          >
            ⚙️ Ramos
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide p-2 space-y-1">
          <CourseTab
            active={activeCourse === "all"}
            color="#4f7cff"
            code="TODOS"
            label="Todos los ramos"
            count={allCourseStats.reduce((acc, stat) => acc + stat.pending, 0)}
            onClick={() => setActiveCourse("all")}
          />
          {courses.map((c) => {
            const stat = allCourseStats.find((s) => s.id === c.id);
            const pendingCount = stat ? stat.pending : 0;
            return (
              <CourseTab
                key={c.id}
                active={activeCourse === c.id}
                color={c.color}
                code={c.code}
                label={c.name}
                count={pendingCount}
                onClick={() => setActiveCourse(c.id)}
              />
            );
          })}
        </div>

        {/* Mini legend */}
        <div className="px-4 py-3 border-t border-border space-y-1">
          {TASK_TYPES.map((c) => (
            <div key={c} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[c] }} />
              <span className="text-[10px] font-mono text-text-dim">{c}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 px-5 py-3.5 border-b border-border flex items-center justify-between gap-4 bg-surface">
          <div className="flex items-center gap-3">
            {activeCourseObj && (
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeCourseObj.color }} />
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-panel text-text-muted border border-border">
                  {activeCourseObj.code}
                </span>
              </div>
            )}
            <h1 className="font-display font-bold text-[16px] text-text">
              {activeCourse === "all" ? "Mi Organizador Personal" : activeCourseObj?.name}
            </h1>
            <span className="text-[10px] font-mono text-text-dim hidden sm:inline">
              {today.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })}
            </span>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4f7cff] hover:bg-[#3d6ae0] text-white text-[12px] font-medium rounded-md transition-colors flex-shrink-0 shadow-lg shadow-[#4f7cff]/20"
          >
            <span className="text-base leading-none">+</span> Nueva actividad
          </button>
        </header>

        {/* Time filter + stats */}
        <div className="flex-shrink-0 border-b border-border bg-surface">
          <div className="flex items-center gap-0 px-5 pt-2">
            {([
              { key: "todas", label: "Todas" },
              { key: "semana", label: "Esta semana" },
              { key: "mes", label: "Este mes" },
            ] as { key: TimeFilter; label: string }[]).map((t) => (
              <button
                key={t.key}
                onClick={() => setTimeFilter(t.key)}
                className={`px-3 py-2 text-[12px] font-semibold border-b-2 -mb-px transition-all ${
                  timeFilter === t.key
                    ? "text-[#4f7cff] border-[#4f7cff]"
                    : "text-text-dim border-transparent hover:text-text-muted"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-5 px-5 pb-2.5 pt-1">
            <StatPill label="Pendientes" value={scopedTasks.filter((t) => t.status === "Pendiente").length} color="var(--color-text-muted)" />
            <StatPill label="En curso" value={scopedTasks.filter((t) => t.status === "En curso").length} color="#f5c842" />
            <StatPill label="Completadas" value={doneCount} color="#2dd67b" />
            <div className="ml-auto flex items-center gap-2">
              <div className="w-24 h-1.5 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%`,
                    backgroundColor: activeCourseObj?.color ?? "#4f7cff",
                  }}
                />
              </div>
              <span className="text-[10px] font-mono text-text-dim">{doneCount}/{totalCount}</span>
            </div>
          </div>
        </div>

        {/* Tabs: lista / semana / mes */}
        <div className="flex-shrink-0 px-5 flex items-center gap-2 border-b border-border bg-background">
          {[
            { key: "lista", label: "📋 Lista de tareas" },
            { key: "semana", label: "📅 Horario semanal" },
            { key: "mes", label: "🗓️ Horario mensual" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as ViewTab)}
              className={`px-3 py-2 text-[11px] font-semibold border-b-2 -mb-px transition-colors ${
                tab === t.key ? "text-[#4f7cff] border-[#4f7cff]" : "text-text-dim border-transparent hover:text-text-muted"
              }`}
            >
              {t.label}
            </button>
          ))}

          {/* Filters for list tab */}
          {tab === "lista" && (
            <div className="ml-auto flex items-center gap-2 py-1.5">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as TaskType | "all")}
                className="bg-panel border border-border rounded-md px-2 py-1 text-[10px] font-mono text-text-muted focus:outline-none focus:border-[#4f7cff]"
              >
                <option value="all">Tipo: todos</option>
                {TASK_TYPES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as OrganizerTask["status"] | "all")}
                className="bg-panel border border-border rounded-md px-2 py-1 text-[10px] font-mono text-text-muted focus:outline-none focus:border-[#4f7cff]"
              >
                <option value="all">Estado: todos</option>
                <option value="Pendiente">Pendiente</option>
                <option value="En curso">En curso</option>
                <option value="Completada">Completada</option>
              </select>
            </div>
          )}
        </div>

        {/* Tab views */}
        {tab === "lista" && (
          <div className="flex-1 overflow-y-auto scrollbar-hide p-5 space-y-2">
            {sortedTasks.map((task) => (
              <OrganizerTaskRow
                key={task.id}
                task={task}
                course={courses.find((c) => c.id === task.courseId)}
                onToggleStatus={() => handleToggleStatus(task)}
                onDelete={() => setConfirmDeleteId(task.id)}
              />
            ))}
            {sortedTasks.length === 0 && (
              <div className="text-center py-16 text-text-dim text-xs font-mono">
                No hay actividades para mostrar
              </div>
            )}
          </div>
        )}

        {tab === "semana" && (
          <WeekScheduleView
            courses={courses}
            sessions={sessions}
            tasks={filteredTasks}
            activeCourse={activeCourse}
          />
        )}

        {tab === "mes" && (
          <MonthScheduleView
            courses={courses}
            sessions={sessions}
            tasks={filteredTasks}
            activeCourse={activeCourse}
            timeFilter={timeFilter}
          />
        )}
      </div>

      {/* Modals */}
      {showManageCourses && (
        <ManageCoursesModal
          courses={courses}
          sessions={sessions}
          onAddCourse={addCourse}
          onDeleteCourse={(id) => void deleteCourse(id)}
          onAddSession={addSession}
          onDeleteSession={deleteSession}
          onClose={() => setShowManageCourses(false)}
        />
      )}

      {showAddModal && (
        <AddOrganizerTaskModal
          courses={courses}
          defaultCourseId={activeCourse === "all" ? (courses[0]?.id ?? null) : activeCourse}
          onClose={() => setShowAddModal(false)}
          onAdd={(t) => {
            addTask(t);
            setShowAddModal(false);
          }}
        />
      )}
      {confirmDeleteId && (
        <ConfirmModal
          title="Eliminar actividad"
          message="¿Seguro que deseas eliminar esta actividad?"
          confirmLabel="Sí, eliminar"
          onConfirm={() => {
            deleteTask(confirmDeleteId);
            setConfirmDeleteId(null);
          }}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <Toast
              message={t.message}
              actionLabel="Deshacer"
              onAction={() => handleUndo(t.id, t.taskId, t.previousStatus)}
              onClose={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
