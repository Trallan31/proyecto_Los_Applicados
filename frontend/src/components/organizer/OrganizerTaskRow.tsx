

import type { OrganizerTask, Course } from "../../types";
import { CATEGORY_COLORS, PRIORITY_META } from "../../constants/ui";
import { parseLocalDate } from "../../utils/dateUtils";
import { Check, Pencil } from "lucide-react";
import { CountdownBadge } from "../shared/CountdownBadge";

export function OrganizerTaskRow({
  task,
  course,
  onToggleStatus,
  onEdit,
  onDelete,
}: {
  task: OrganizerTask;
  course?: Course;
  onToggleStatus: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isDone = task.status === "Completada";
  const due = parseLocalDate(task.endDate);

  return (
    <div className={`p-3.5 rounded-xl border transition-all duration-300 ${isDone ? "bg-surface/40 border-border/50 opacity-65" : "bg-surface border-border hover:border-border-bright"}`}>
      <div className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleStatus}
            type="button"
            aria-label={isDone ? "Marcar como pendiente" : "Marcar como completada"}
            title={isDone ? "Marcar como pendiente" : "Marcar como completada"}
            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 transform active:scale-75 flex-shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue ${
              isDone
                ? "bg-accent-green border-accent-green text-black shadow-sm shadow-accent-green/30 scale-100"
                : "border-text-muted hover:border-accent-blue hover:bg-accent-blue/10 text-transparent"
            }`}
          >
            <Check className={`w-3.5 h-3.5 stroke-[3] transition-all duration-200 ${isDone ? "scale-100 opacity-100" : "scale-0 opacity-0"}`} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-[13px] font-semibold transition-all duration-200 truncate ${isDone ? "line-through text-text-muted" : "text-text"}`}>
                {task.title}
              </span>
              {course && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded flex-shrink-0" style={{ backgroundColor: `${course.color}25`, color: course.color, border: `1px solid ${course.color}50` }}>
                  {course.code}
                </span>
              )}
            </div>
            {task.notes && <p className="text-[12px] text-text-muted mt-0.5 line-clamp-1">{task.notes}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <span
            className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded"
            style={{ backgroundColor: PRIORITY_META[task.priority].bg, color: PRIORITY_META[task.priority].color }}
          >
            {task.priority}
          </span>
          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded" style={{ backgroundColor: `${CATEGORY_COLORS[task.type]}20`, color: CATEGORY_COLORS[task.type] }}>
            {task.type}
          </span>
          <div className="text-right flex flex-col items-end gap-1">
            <CountdownBadge dateStr={task.endDate} isDone={isDone} />
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-muted">
              <span>{due.toLocaleDateString("es-CL", { day: "numeric", month: "short" })}</span>
              {task.dueTime && <span>• {task.dueTime}</span>}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onEdit}
              title="Editar actividad"
              aria-label="Editar actividad"
              className="text-text-muted hover:text-accent-blue transition-colors p-1.5 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-blue"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              title="Eliminar actividad"
              aria-label="Eliminar actividad"
              className="text-text-muted hover:text-accent-red transition-colors p-1.5 rounded text-xs font-bold leading-none cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-red"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
