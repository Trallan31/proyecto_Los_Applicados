import type { OrganizerTask, Course, Project } from "../../types";
import { getAccessibleColor, getCategoryColor, getPriorityMeta } from "../../constants/ui";
import { useIsDark } from "../../context/ThemeContext";
import { formatDisplayDate } from "../../utils/dateUtils";
import { activityIdOf, isScrumTask } from "../../utils/scrumSync";
import { Check, Pencil, Trash2, TrashOff, Users } from "lucide-react";
import { CountdownBadge } from "../shared/CountdownBadge";
import { useNavigate } from "react-router-dom";

export function OrganizerTaskRow({
  task,
  course,
  project,
  showCourseBadge = true,
  isSelected = false,
  onSelect,
  onToggleStatus,
  onEdit,
  onDelete,
}: {
  task: OrganizerTask;
  course?: Course;
  project?: Project;
  showCourseBadge?: boolean;
  isSelected?: boolean;
  onSelect: () => void;
  onToggleStatus: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const navigate = useNavigate();
  const isDark = useIsDark();
  const isDone = task.status === "Completada";
  // Las tareas que vienen del tablero se editan y se borran allá.
  const fromScrum = isScrumTask(task);

  const priorityMeta = getPriorityMeta(task.priority, isDark);
  const categoryColor = getCategoryColor(task.type, isDark);
  const projectColor = getAccessibleColor(project?.color ?? "#9b6dff", isDark);
  const courseColor = course ? getAccessibleColor(course.color, isDark) : "";

  return (
    <div
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (!fromScrum) onEdit();
      }}
      className={`group relative p-3.5 rounded-xl border transition-all duration-200 ${
        isSelected
          ? "border-accent-blue bg-accent-blue/[0.04] dark:bg-accent-blue/[0.08] shadow-sm shadow-accent-blue/10 ring-1 ring-accent-blue/30"
          : isDone
            ? "bg-surface/40 border-border/50 opacity-65 hover:border-border-bright hover:bg-surface/60"
            : "bg-surface border-border hover:border-border-bright hover:bg-panel/20 hover:shadow-xs"
      }`}
    >
      <div className="flex items-center justify-between gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
        <button
          onClick={onToggleStatus}
          type="button"
          aria-label={isDone ? "Marcar como pendiente" : "Marcar como completada"}
          title={isDone ? "Marcar como pendiente" : "Marcar como completada"}
          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 transform active:scale-75 flex-shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue ${
            isDone
              ? "bg-accent-green border-accent-green text-white shadow-sm shadow-accent-green/30 scale-100"
              : "border-border-bright hover:border-accent-blue hover:bg-accent-blue/10 text-transparent"
          }`}
        >
          <Check
            className={`w-3.5 h-3.5 stroke-[3] transition-all duration-200 ${
              isDone ? "scale-100 opacity-100" : "scale-0 opacity-0"
            }`}
          />
        </button>

        {/* Área interactiva principal para seleccionar la fila (hermana de los botones de acción) */}
        <button
          type="button"
          onClick={onSelect}
          onKeyDown={(e) => {
            if ((e.key === "e" || e.key === "E") && !fromScrum) {
              e.preventDefault();
              onEdit();
            }
          }}
          aria-pressed={isSelected}
          className="flex-1 min-w-0 flex items-center justify-between gap-3 sm:gap-4 flex-wrap sm:flex-nowrap text-left cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
        >
          <span className="min-w-0 flex-1 block">
            <span className="flex items-center gap-2">
              <span
                className={`text-[13px] font-semibold transition-all duration-200 truncate ${
                  isDone ? "line-through text-text-muted" : "text-text"
                }`}
              >
                {task.title}
              </span>
              {fromScrum && (
                <span
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded flex-shrink-0 inline-flex items-center gap-1"
                  style={{
                    backgroundColor: `${projectColor}20`,
                    color: projectColor,
                    border: `1px solid ${projectColor}40`,
                  }}
                  title={
                    project
                      ? `Asignada en el proyecto ${project.name}`
                      : "Asignada en un proyecto de equipo"
                  }
                >
                  <Users className="w-2.5 h-2.5" aria-hidden="true" />
                  {project?.name ?? "Equipo"}
                </span>
              )}
              {course && showCourseBadge && (
                <span
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded flex-shrink-0"
                  style={{
                    backgroundColor: `${courseColor}20`,
                    color: courseColor,
                    border: `1px solid ${courseColor}40`,
                  }}
                >
                  {course.code}
                </span>
              )}
            </span>
            {task.notes && (
              <span className="block text-[12px] text-text-muted mt-0.5 line-clamp-1">
                {task.notes}
              </span>
            )}
          </span>

          <span className="flex items-center gap-3 flex-shrink-0 ml-auto sm:ml-0">
            <span
              className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: priorityMeta.bg,
                color: priorityMeta.color,
              }}
            >
              {task.priority}
            </span>
            <span
              className="text-[10px] font-mono font-medium px-2 py-0.5 rounded"
              style={{
                backgroundColor: `${categoryColor}20`,
                color: categoryColor,
              }}
            >
              {task.type}
            </span>
            <span className="text-right flex flex-col items-end gap-1">
              <CountdownBadge dateStr={task.endDate} isDone={isDone} />
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-text-muted">
                <span>{formatDisplayDate(task.endDate)}</span>
                {task.dueTime && <span>• {task.dueTime}</span>}
              </span>
            </span>
          </span>
        </button>

        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
          {fromScrum ? (
            <>
              <button
                type="button"
                onClick={() => {
                  navigate(`/scrum?project=${task.projectId}`, { state: { taskId: activityIdOf(task.id) } });
                }}
                title="Editar desde proyecto"
                aria-label="Editar desde proyecto"
                className="text-text-muted hover:text-accent-blue transition-colors p-1.5 rounded-lg cursor-pointer hover:bg-panel focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-blue"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <span
                title="Eliminable desde el proyecto"
                className="text-text-muted p-1.5 rounded-lg cursor-not-allowed inline-flex items-center"
              >
                <TrashOff className="w-3.5 h-3.5" aria-hidden="true" />
              </span>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onEdit}
                title="Editar actividad"
                aria-label="Editar actividad"
                className="text-text-muted hover:text-accent-blue transition-colors p-1.5 rounded-lg cursor-pointer hover:bg-panel focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-blue"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onDelete}
                title="Eliminar actividad"
                aria-label="Eliminar actividad"
                className="text-text-muted hover:text-accent-red transition-colors p-1.5 rounded-lg cursor-pointer hover:bg-panel focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-red"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
