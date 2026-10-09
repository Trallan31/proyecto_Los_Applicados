

import type { OrganizerTask, Course } from "../../types";
import { CATEGORY_COLORS } from "../../constants/ui";
import { parseLocalDate } from "../../utils/dateUtils";
import { Check } from "lucide-react";
import { CountdownBadge } from "../shared/CountdownBadge";

export function OrganizerTaskRow({
  task,
  course,
  onToggleStatus,
  onDelete,
}: {
  task: OrganizerTask;
  course?: Course;
  onToggleStatus: () => void;
  onDelete: () => void;
}) {
  const isDone = task.status === "Completada";
  const due = parseLocalDate(task.endDate);

  return (
    <div className={`p-3.5 rounded-xl border transition-all duration-300 ${isDone ? "bg-surface/40 border-border/50 opacity-65" : "bg-surface border-border hover:border-border-bright"}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleStatus}
            type="button"
            aria-label={isDone ? "Marcar como pendiente" : "Marcar como completada"}
            title={isDone ? "Marcar como pendiente" : "Marcar como completada"}
            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 transform active:scale-75 flex-shrink-0 ${
              isDone
                ? "bg-[#2dd67b] border-[#2dd67b] text-[#0d0f14] shadow-sm shadow-[#2dd67b]/30 scale-100"
                : "border-text-dim hover:border-[#4f7cff] hover:bg-[#4f7cff]/10 text-transparent"
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
            {task.notes && <p className="text-[11px] text-text-muted mt-0.5 line-clamp-1">{task.notes}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ backgroundColor: `${CATEGORY_COLORS[task.type]}20`, color: CATEGORY_COLORS[task.type] }}>
            {task.type}
          </span>
          <div className="text-right flex flex-col items-end gap-1">
            <CountdownBadge dateStr={task.endDate} isDone={isDone} />
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-muted">
              <span>{due.toLocaleDateString("es-CL", { day: "numeric", month: "short" })}</span>
              {task.dueTime && <span>• {task.dueTime}</span>}
            </div>
          </div>
          <button onClick={onDelete} className="text-text-dim hover:text-[#ff5c6a] transition-colors text-xs font-bold px-1">✕</button>
        </div>
      </div>
    </div>
  );
}
