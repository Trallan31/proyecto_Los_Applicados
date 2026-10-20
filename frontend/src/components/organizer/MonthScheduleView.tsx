import { Clock, BookOpen } from "lucide-react";
import type { OrganizerTask, Course, CourseSession, Project } from "../../types";
import { CATEGORY_COLORS } from "../../constants/ui";
import { formatLocalDate, getWeekBounds, getToday, WEEK_DAYS, type TimeFilter } from "../../utils/dateUtils";

export function MonthScheduleView({
  courses,
  projects = [],
  sessions,
  tasks,
  activeCourse,
  timeFilter,
}: {
  courses: Course[];
  projects?: Project[];
  sessions: CourseSession[];
  tasks: OrganizerTask[];
  activeCourse: string | "all";
  timeFilter: TimeFilter;
}) {
  const today = getToday();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed
  const currentWeekBounds = getWeekBounds(today);

  // Build calendar days array for the month
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = lastDay.getDate();

  const calendarCells = [];
  // Empty padding cells before 1st of month
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarCells.push(null);
  }
  // Days 1..daysInMonth
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(new Date(year, month, d));
  }

  const visibleSessions =
    activeCourse === "all" || activeCourse === "all-courses"
      ? sessions
      : activeCourse === "all-projects" || activeCourse.startsWith("project:")
      ? []
      : sessions.filter((s) => s.courseId === activeCourse);

  return (
    <div className="flex-1 overflow-auto scrollbar-hide p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display font-bold text-sm text-text uppercase tracking-wider">
          {today.toLocaleDateString("es-CL", { month: "long", year: "numeric" })}
        </h3>
      </div>

      <div className="border border-border rounded-xl overflow-hidden bg-surface">
        {/* Day Header */}
        <div className="grid grid-cols-7 border-b border-border bg-panel text-center">
          {WEEK_DAYS.map((d) => (
            <div key={d} className="py-2 text-[10px] font-mono font-bold text-text-muted uppercase">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 auto-rows-fr bg-border/20 gap-px">
          {calendarCells.map((date, idx) => {
            if (!date) {
              return <div key={`empty-${idx}`} className="bg-background/50 min-h-[100px]" />;
            }

            const dayNum = date.getDate();
            const dateStr = formatLocalDate(date);
            const dayOfWeek = (date.getDay() + 6) % 7; // Monday = 0
            const isToday = date.toDateString() === today.toDateString();

            const inCurrentWeek = date >= currentWeekBounds.start && date <= currentWeekBounds.end;

            // Recurring course sessions for this day of week
            const daySessions = (timeFilter === "semana" && !inCurrentWeek)
              ? []
              : visibleSessions.filter((s) => s.dayOfWeek === dayOfWeek);

            // Student tasks due on this date
            const dayTasks = tasks.filter((t) => t.endDate === dateStr);

            return (
              <div
                key={dateStr}
                className={`bg-surface min-h-[110px] p-1.5 border-t border-border/40 flex flex-col gap-1 hover:bg-panel-hover/60 transition-colors ${
                  isToday ? "bg-accent-blue/10" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[11px] font-mono font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                      isToday ? "bg-accent-blue text-white" : "text-text-muted"
                    }`}
                  >
                    {dayNum}
                  </span>
                  {(daySessions.length > 0 || dayTasks.length > 0) && (
                    <span className="text-[9px] font-mono text-text-muted font-medium">
                      {daySessions.length + dayTasks.length} ítems
                    </span>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-hide space-y-1">
                  {/* Tasks without hour appear FIRST at the top */}
                  {dayTasks
                    .filter((t) => !t.dueTime)
                    .map((t) => {
                      const course = courses.find((c) => c.id === t.courseId);
                      const project = projects.find((p) => p.id === t.projectId);
                      const color = course?.color ?? project?.color ?? CATEGORY_COLORS[t.type] ?? "#4f7cff";
                      return (
                        <div
                          key={`task-${t.id}`}
                          className="px-1.5 py-0.5 rounded text-[9px] font-semibold text-text truncate border-l-2 shadow-xs flex items-center gap-1.5"
                          style={{ backgroundColor: `${color}25`, borderColor: color }}
                          title={`${t.title} (Sin hora)`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          <span className="truncate">{t.title}</span>
                        </div>
                      );
                    })}

                  {/* Tasks WITH specific hour */}
                  {dayTasks
                    .filter((t) => t.dueTime)
                    .map((t) => {
                      const course = courses.find((c) => c.id === t.courseId);
                      const project = projects.find((p) => p.id === t.projectId);
                      const color = course?.color ?? project?.color ?? CATEGORY_COLORS[t.type] ?? "#4f7cff";
                      return (
                        <div
                          key={`task-time-${t.id}`}
                          className="px-1.5 py-0.5 rounded text-[9px] font-semibold text-text truncate border-l-2 shadow-xs flex items-center gap-1"
                          style={{ backgroundColor: `${color}35`, borderColor: color }}
                          title={`${t.title} (${t.dueTime})`}
                        >
                          <Clock className="w-2.5 h-2.5 shrink-0 opacity-70" />
                          <span className="font-mono text-[8.5px] opacity-80 shrink-0">{t.dueTime}</span>
                          <span className="truncate">{t.title}</span>
                        </div>
                      );
                    })}

                  {/* Course Sessions (Classes/Labs) */}
                  {daySessions.map((s) => {
                    const course = courses.find((c) => c.id === s.courseId);
                    const color = course?.color ?? "#9b6dff";
                    return (
                      <div
                        key={`session-${s.id}`}
                        className="px-1.5 py-0.5 rounded text-[8px] font-mono text-text truncate border-l-2 opacity-85 flex items-center gap-1"
                        style={{ backgroundColor: `${color}20`, borderColor: color }}
                        title={`${course?.name} (${s.type} ${s.startHour}:00)`}
                      >
                        <BookOpen className="w-2.5 h-2.5 shrink-0 opacity-70" />
                        <span className="truncate font-medium">{course?.code}</span>
                        <span className="text-[7.5px] opacity-75 shrink-0">({s.type})</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
