import { useState } from "react";
import { Settings, ListTodo, CalendarDays, Calendar } from "lucide-react";
import { CATEGORY_COLORS, TASK_TYPES } from "./constants/ui";
import type { OrganizerTask, TaskType, CourseLink } from "./types";
import { getToday, type ViewTab, type TimeFilter } from "./utils/dateUtils";
import { useOrganizerBoard } from "./hooks/useOrganizerBoard";
import { CourseTab } from "./components/organizer/CourseTab";
import { StatPill } from "./components/organizer/StatPill";
import { OrganizerTaskRow } from "./components/organizer/OrganizerTaskRow";
import { OrganizerTaskDetail } from "./components/organizer/OrganizerTaskDetail";
import { WeekScheduleView } from "./components/organizer/WeekScheduleView";
import { MonthScheduleView } from "./components/organizer/MonthScheduleView";
import { CourseLinksBar } from "./components/organizer/CourseLinksBar";
import { CourseLinkModal } from "./components/organizer/modals/CourseLinkModal";
import { ManageCoursesModal } from "./components/organizer/modals/ManageCoursesModal";
import { AddOrganizerTaskModal } from "./components/organizer/modals/AddOrganizerTaskModal";
import { ConfirmModal } from "./components/shared/ConfirmModal";
import { Loading, ErrorBox, Toast } from "./components/shared/Feedback";


let toastCounter = 0;

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
    updateTask,
    addCourse,
    deleteCourse,
    addSession,
    deleteSession,
    addCourseLink,
    deleteCourseLink,
    updateCourseLink,
    allCourseStats,
    scopedTasks,
    doneCount,
    totalCount,
    activeCourseObj,
  } = useOrganizerBoard();

  const today = getToday();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<OrganizerTask | null>(null);
  const [showManageCourses, setShowManageCourses] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showCourseLinkModal, setShowCourseLinkModal] = useState(false);
  const [editingCourseLink, setEditingCourseLink] = useState<CourseLink | null>(null);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; taskId: string; previousStatus: OrganizerTask["status"] }>>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const selectedTask = scopedTasks.find((t) => t.id === selectedTaskId) ?? null;

  function handleSelectCourse(courseId: string | "all") {
    setActiveCourse(courseId);
    setSelectedTaskId(null);
  }

  function handleSelectTab(nextTab: ViewTab) {
    setTab(nextTab);
    setSelectedTaskId(null);
  }

  function handleToggleStatus(task: OrganizerTask) {
    const previousStatus = task.status;
    const nextStatus = toggleTaskStatus(task.id);
    if (nextStatus === "Completada") {
      const toastId = `${task.id}-${++toastCounter}`;
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
          <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-text-muted">Mis Ramos</span>
          <button
            onClick={() => setShowManageCourses(true)}
            className="inline-flex items-center gap-1 text-[10px] font-mono text-text-muted hover:text-accent-blue transition-colors cursor-pointer"
            title="Gestionar ramos y horarios"
          >
            <Settings className="w-3 h-3" />
            <span>Ramos</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide p-2 space-y-1">
          <CourseTab
            active={activeCourse === "all"}
            color="#4f7cff"
            code="TODOS"
            label="Todos los ramos"
            count={allCourseStats.reduce((acc, stat) => acc + stat.pending, 0)}
            onClick={() => handleSelectCourse("all")}
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
                onClick={() => handleSelectCourse(c.id)}
              />
            );
          })}
        </div>

        {/* Mini legend */}
        <div className="px-4 py-3 border-t border-border space-y-1">
          {TASK_TYPES.map((c) => (
            <div key={c} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[c] }} />
              <span className="text-[10px] font-mono text-text-muted">{c}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 px-5 py-3 border-b border-border bg-surface flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {activeCourseObj && (
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeCourseObj.color }} />
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-panel text-text border border-border">
                    {activeCourseObj.code}
                  </span>
                </div>
              )}
              <h1 className="font-display font-bold text-[16px] text-text">
                {activeCourse === "all" ? "Mi Organizador Personal" : activeCourseObj?.name}
              </h1>
              <span className="text-[11px] font-mono text-text-muted hidden sm:inline">
                {today.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-blue hover:opacity-90 text-white text-[12px] font-medium rounded-md transition-colors flex-shrink-0 shadow-lg shadow-accent-blue/20 cursor-pointer"
            >
              <span className="text-base leading-none">+</span> Nueva actividad
            </button>
          </div>

          {activeCourse !== "all" && activeCourseObj && (
            <div className="pt-1.5 border-t border-border/50">
              <CourseLinksBar
                links={activeCourseObj.links || []}
                courseColor={activeCourseObj.color}
                onAddLink={() => {
                  setEditingCourseLink(null);
                  setShowCourseLinkModal(true);
                }}
                onEditLink={(link) => {
                  setEditingCourseLink(link);
                  setShowCourseLinkModal(true);
                }}
                onDeleteLink={(linkId) => {
                  deleteCourseLink(activeCourseObj.id, linkId);
                }}
              />
            </div>
          )}
        </header>

        {/* Barra de navegación principal (Tabs + Stats compactas) */}
        <div className="flex-shrink-0 px-5 border-b border-border bg-surface flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
          {/* Pestañas de vista a la izquierda */}
          <div className="flex items-center gap-1">
            {[
              { key: "lista", label: "Lista de tareas", icon: ListTodo },
              { key: "semana", label: "Horario semanal", icon: CalendarDays },
              { key: "mes", label: "Horario mensual", icon: Calendar },
            ].map((t) => {
              const Icon = t.icon;
              const isActive = tab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => handleSelectTab(t.key as ViewTab)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-semibold border-b-2 -mb-px transition-colors cursor-pointer ${
                    isActive
                      ? "text-accent-blue border-accent-blue font-bold"
                      : "text-text-muted border-transparent hover:text-text"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Estadísticas compactas a la derecha */}
          <div className="flex items-center gap-4 py-1.5 ml-auto">
            <StatPill label="Pendientes" value={scopedTasks.filter((t) => t.status === "Pendiente").length} color="var(--color-text-muted)" />
            <StatPill label="En curso" value={scopedTasks.filter((t) => t.status === "En curso").length} color="var(--color-accent-yellow)" />
            <StatPill label="Completadas" value={doneCount} color="var(--color-accent-green)" />
            <div className="flex items-center gap-2 pl-3 border-l border-border/60">
              <div className="w-20 h-1.5 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%`,
                    backgroundColor: activeCourseObj?.color ?? "var(--color-accent-blue)",
                  }}
                />
              </div>
              <span className="text-[10px] font-mono text-text-muted font-medium">{doneCount}/{totalCount}</span>
            </div>
          </div>
        </div>

        {/* Sub-barra ligera de filtros (solo visible en Lista de tareas) */}
        {tab === "lista" && (
          <div className="flex-shrink-0 px-5 py-2 border-b border-border bg-background/80 flex items-center justify-between gap-4">
            {/* Selector de tiempo segmentado */}
            <div className="flex items-center bg-panel p-0.5 rounded-lg border border-border/50">
              {([
                { key: "todas", label: "Todas" },
                { key: "semana", label: "Esta semana" },
                { key: "mes", label: "Este mes" },
              ] as { key: TimeFilter; label: string }[]).map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTimeFilter(t.key)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                    timeFilter === t.key
                      ? "bg-surface text-text shadow-xs font-semibold"
                      : "text-text-muted hover:text-text"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Selectores de Tipo y Estado */}
            <div className="flex items-center gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as TaskType | "all")}
                className="bg-panel border border-border rounded-md px-2 py-1 text-[11px] font-mono text-text focus:outline-none focus:border-accent-blue cursor-pointer"
              >
                <option value="all">Tipo: todos</option>
                {TASK_TYPES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as OrganizerTask["status"] | "all")}
                className="bg-panel border border-border rounded-md px-2 py-1 text-[11px] font-mono text-text focus:outline-none focus:border-accent-blue cursor-pointer"
              >
                <option value="all">Estado: todos</option>
                <option value="Pendiente">Pendiente</option>
                <option value="En curso">En curso</option>
                <option value="Completada">Completada</option>
              </select>
            </div>
          </div>
        )}

        {/* Tab views */}
        {tab === "lista" && (
          <div className="flex-1 flex overflow-hidden relative">
            <div className="flex-1 overflow-y-auto scrollbar-hide p-5 space-y-2 min-w-0">
              {sortedTasks.map((task) => (
                <OrganizerTaskRow
                  key={task.id}
                  task={task}
                  course={courses.find((c) => c.id === task.courseId)}
                  showCourseBadge={activeCourse === "all"}
                  isSelected={selectedTaskId === task.id}
                  onSelect={() => setSelectedTaskId(task.id)}
                  onToggleStatus={() => handleToggleStatus(task)}
                  onEdit={() => setEditingTask(task)}
                  onDelete={() => setConfirmDeleteId(task.id)}
                />
              ))}
              {sortedTasks.length === 0 && (
                <div className="text-center py-16 text-text-muted text-xs font-mono">
                  No hay actividades para mostrar
                </div>
              )}
            </div>
            {selectedTask && (
              <OrganizerTaskDetail
                task={selectedTask}
                course={courses.find((c) => c.id === selectedTask.courseId)}
                isModalOpen={editingTask !== null || confirmDeleteId !== null}
                onClose={() => setSelectedTaskId(null)}
                onToggleStatus={() => handleToggleStatus(selectedTask)}
                onStatusChange={(newStatus) => setTaskStatus(selectedTask.id, newStatus)}
                onEdit={() => setEditingTask(selectedTask)}
                onDelete={() => setConfirmDeleteId(selectedTask.id)}
              />
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
      {editingTask !== null && (
        <AddOrganizerTaskModal
          initialTask={editingTask}
          courses={courses}
          defaultCourseId={editingTask.courseId}
          onClose={() => setEditingTask(null)}
          onEdit={(id, changes) => {
            updateTask(id, changes);
            setToasts((prev) => prev.filter((t) => t.taskId !== id));
            setEditingTask(null);
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
            if (confirmDeleteId === selectedTaskId) {
              setSelectedTaskId(null);
            }
            setToasts((prev) => prev.filter((t) => t.taskId !== confirmDeleteId));
            setConfirmDeleteId(null);
          }}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
      {showCourseLinkModal && activeCourseObj && (
        <CourseLinkModal
          key={editingCourseLink?.id ?? "new"}
          isOpen={showCourseLinkModal}
          linkToEdit={editingCourseLink}
          courseName={activeCourseObj.name}
          onClose={() => {
            setShowCourseLinkModal(false);
            setEditingCourseLink(null);
          }}
          onSave={(link) => {
            if (editingCourseLink) {
              updateCourseLink(activeCourseObj.id, editingCourseLink.id, link);
            } else {
              addCourseLink(activeCourseObj.id, link);
            }
          }}
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
