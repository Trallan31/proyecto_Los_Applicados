import type React from "react";
import type { OrganizerTask, Course } from "../../types";
import { CATEGORY_COLORS, PRIORITY_META } from "../../constants/ui";
import { parseLocalDate } from "../../utils/dateUtils";
import { Check, Pencil, Trash2 } from "lucide-react";
import { CountdownBadge } from "../shared/CountdownBadge";

export function OrganizerTaskRow({
  task,
  course,
  showCourseBadge = true,
  isSelected = false,
  onSelect,
  onToggleStatus,
  onEdit,
  onDelete,
}: {
  task: OrganizerTask;
  course?: Course;
  showCourseBadge?: boolean;
  isSelected?: boolean;
  onSelect: () => void;
  onToggleStatus: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isDone = task.status === "Completada";
  const due = parseLocalDate(task.endDate);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect();
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-selected={isSelected}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      className={`group relative p-3.5 rounded-xl border transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue ${
        isSelected
          ? "border-accent-blue bg-accent-blue/[0.04] dark:bg-accent-blue/[0.08] shadow-sm shadow-accent-blue/10 ring-1 ring-accent-blue/30"
          : isDone
            ? "bg-surface/40 border-border/50 opacity-65 hover:border-border-bright hover:bg-surface/60"
            : "bg-surface border-border hover:border-border-bright hover:bg-panel/20 hover:shadow-xs"
      }`}
    >
      <div className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleStatus();
            }}
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
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`text-[13px] font-semibold transition-all duration-200 truncate ${
                  isDone ? "line-through text-text-muted" : "text-text"
                }`}
              >
                {task.title}
              </span>
              {course && showCourseBadge && (
                <span
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded flex-shrink-0"
                  style={{
                    backgroundColor: `${course.color}20`,
                    color: course.color,
                    border: `1px solid ${course.color}40`,
                  }}
                >
                  {course.code}
                </span>
              )}
            </div>
            {task.notes && (
              <p className="text-[12px] text-text-muted mt-0.5 line-clamp-1">
                {task.notes}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <span
            className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: PRIORITY_META[task.priority].bg,
              color: PRIORITY_META[task.priority].color,
            }}
          >
            {task.priority}
          </span>
          <span
            className="text-[10px] font-mono font-medium px-2 py-0.5 rounded"
            style={{
              backgroundColor: `${CATEGORY_COLORS[task.type]}20`,
              color: CATEGORY_COLORS[task.type],
            }}
          >
            {task.type}
          </span>
          <div className="text-right flex flex-col items-end gap-1">
            <CountdownBadge dateStr={task.endDate} isDone={isDone} />
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-muted">
              <span>{due.toLocaleDateString("es-CL", { day: "numeric", month: "short" })}</span>
              {task.dueTime && <span>• {task.dueTime}</span>}
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              title="Editar actividad"
              aria-label="Editar actividad"
              className="text-text-muted hover:text-accent-blue transition-colors p-1.5 rounded-lg cursor-pointer hover:bg-panel focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-blue"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Eliminar actividad"
              aria-label="Eliminar actividad"
              className="text-text-muted hover:text-accent-red transition-colors p-1.5 rounded-lg cursor-pointer hover:bg-panel focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-red"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
