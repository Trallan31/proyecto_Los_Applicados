

import type { OrganizerTask, Course } from "../../types";
import { CATEGORY_COLORS } from "../../constants/ui";
import { getToday, parseLocalDate, isOverdue } from "../../utils/dateUtils";


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
  const today = getToday();
  const isDone = task.status === "Completada";
  const due = parseLocalDate(task.endDate);
  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const overdue = isOverdue(task.endDate, isDone);

  return (
    <div className={`p-3.5 rounded-xl border transition-all ${isDone ? "bg-surface/40 border-border/50 opacity-60" : "bg-surface border-border hover:border-border-bright"}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleStatus}
            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
              isDone ? "bg-[#2dd67b] border-[#2dd67b] text-black font-bold" : "border-text-dim hover:border-[#4f7cff]"
            }`}
          >
            {isDone && "✓"}
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[13px] font-semibold ${isDone ? "line-through text-text-muted" : "text-text"}`}>
                {task.title}
              </span>
              {course && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: `${course.color}30`, color: course.color, border: `1px solid ${course.color}50` }}>
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
          <div className="text-right">
            <p className={`text-[11px] font-mono ${overdue ? "text-[#ff5c6a]" : "text-text-muted"}`}>
              {overdue ? "Vencida" : diffDays === 0 ? "Hoy" : diffDays === 1 ? "Mañana" : due.toLocaleDateString("es-CL", { day: "numeric", month: "short" })}
            </p>
            {task.dueTime && <p className="text-[9px] font-mono text-text-dim">{task.dueTime}</p>}
          </div>
          <button onClick={onDelete} className="text-text-dim hover:text-[#ff5c6a] transition-colors text-xs font-bold px-1">✕</button>
        </div>
      </div>
    </div>
  );
}
