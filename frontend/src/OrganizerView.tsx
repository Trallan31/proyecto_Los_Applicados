import { useState } from "react";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "./data/mockOrganizer";
import { type OrganizerTask, type TaskType } from "./types/organizer";
import { type ViewTab, type TimeFilter } from "./utils/dateUtils";
import { useOrganizerBoard } from "./hooks/useOrganizerBoard";
import { CourseTab } from "./components/organizer/CourseTab";
import { StatPill } from "./components/organizer/StatPill";
import { OrganizerTaskRow } from "./components/organizer/OrganizerTaskRow";
import { WeekScheduleView } from "./components/organizer/WeekScheduleView";
import { MonthScheduleView } from "./components/organizer/MonthScheduleView";
import { ManageCoursesModal } from "./components/organizer/modals/ManageCoursesModal";
import { AddOrganizerTaskModal } from "./components/organizer/modals/AddOrganizerTaskModal";
import { ConfirmModal } from "./components/shared/ConfirmModal";

const TODAY = new Date();

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
    toggleTaskStatus,
    deleteTask,
    handleSaveCourses,
    handleAddTask,
    allCourseStats,
    scopedTasks,
    doneCount,
    totalCount,
    activeCourseObj,
  } = useOrganizerBoard();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showManageCourses, setShowManageCourses] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  return (
    <div className="flex h-full overflow-hidden text-[#e8eaf2]">
      {/* Course sidebar */}
      <div className="w-56 flex-shrink-0 border-r border-[#2a2f45] bg-[#151820] flex flex-col">
        <div className="px-4 py-3 border-b border-[#2a2f45] flex items-center justify-between">
          <span className="text-[10px] font-mono font-medium uppercase tracking-widest text-[#4a5070]">Mis Ramos</span>
          <button
            onClick={() => setShowManageCourses(true)}
            className="text-[10px] font-mono text-[#4a5070] hover:text-[#4f7cff] transition-colors"
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
        <div className="px-4 py-3 border-t border-[#2a2f45] space-y-1">
          {(["Tarea", "Evaluación", "Proyecto", "Lectura"] as TaskType[]).map((c) => (
            <div key={c} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[c] }} />
              <span className="text-[10px] font-mono text-[#4a5070]">{CATEGORY_LABELS[c]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 px-5 py-3.5 border-b border-[#2a2f45] flex items-center justify-between gap-4 bg-[#151820]">
          <div className="flex items-center gap-3">
            {activeCourseObj && (
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeCourseObj.color }} />
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#1c2030] text-[#7c82a0] border border-[#2a2f45]">
                  {activeCourseObj.code}
                </span>
              </div>
            )}
            <h1 className="font-display font-bold text-[16px] text-[#e8eaf2]">
              {activeCourse === "all" ? "Mi Organizador Personal" : activeCourseObj?.name}
            </h1>
            <span className="text-[10px] font-mono text-[#4a5070] hidden sm:inline">
              {TODAY.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })}
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
        <div className="flex-shrink-0 border-b border-[#2a2f45] bg-[#151820]">
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
                    : "text-[#4a5070] border-transparent hover:text-[#7c82a0]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-5 px-5 pb-2.5 pt-1">
            <StatPill label="Pendientes" value={scopedTasks.filter((t) => t.status === "Pendiente").length} color="#7c82a0" />
            <StatPill label="En curso" value={scopedTasks.filter((t) => t.status === "En curso").length} color="#f5c842" />
            <StatPill label="Completadas" value={doneCount} color="#2dd67b" />
            <div className="ml-auto flex items-center gap-2">
              <div className="w-24 h-1.5 bg-[#2a2f45] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%`,
                    backgroundColor: activeCourseObj?.color ?? "#4f7cff",
                  }}
                />
              </div>
              <span className="text-[10px] font-mono text-[#4a5070]">{doneCount}/{totalCount}</span>
            </div>
          </div>
        </div>

        {/* Tabs: lista / semana / mes */}
        <div className="flex-shrink-0 px-5 flex items-center gap-2 border-b border-[#2a2f45] bg-[#0d0f14]">
          {[
            { key: "lista", label: "📋 Lista de tareas" },
            { key: "semana", label: "📅 Horario semanal" },
            { key: "mes", label: "🗓️ Horario mensual" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as ViewTab)}
              className={`px-3 py-2 text-[11px] font-semibold border-b-2 -mb-px transition-colors ${
                tab === t.key ? "text-[#4f7cff] border-[#4f7cff]" : "text-[#4a5070] border-transparent hover:text-[#7c82a0]"
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
                className="bg-[#1c2030] border border-[#2a2f45] rounded-md px-2 py-1 text-[10px] font-mono text-[#7c82a0] focus:outline-none focus:border-[#4f7cff]"
              >
                <option value="all">Tipo: todos</option>
                {(Object.keys(CATEGORY_LABELS) as TaskType[]).map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as OrganizerTask["status"] | "all")}
                className="bg-[#1c2030] border border-[#2a2f45] rounded-md px-2 py-1 text-[10px] font-mono text-[#7c82a0] focus:outline-none focus:border-[#4f7cff]"
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
                onToggleStatus={() => toggleTaskStatus(task.id)}
                onDelete={() => setConfirmDeleteId(task.id)}
              />
            ))}
            {sortedTasks.length === 0 && (
              <div className="text-center py-16 text-[#4a5070] text-xs font-mono">
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
          onClose={() => setShowManageCourses(false)}
          onSave={(newCourses, newSessions) => {
            handleSaveCourses(newCourses, newSessions);
          }}
        />
      )}

      {showAddModal && (
        <AddOrganizerTaskModal
          courses={courses}
          defaultCourseId={activeCourse === "all" ? courses[0]?.id : activeCourse}
          onClose={() => setShowAddModal(false)}
          onAdd={(t) => {
            handleAddTask(t);
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
    </div>
  );
}
