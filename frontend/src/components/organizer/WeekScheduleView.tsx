import type { OrganizerTask, Course, CourseSession } from "../../types";
import { CATEGORY_COLORS } from "../../constants/ui";
import { FULL_DAYS, WEEK_DAYS, HOURS, formatLocalDate, getToday, type DayScheduleItem } from "../../utils/dateUtils";

export function WeekScheduleView({
  courses,
  sessions,
  tasks,
  activeCourse,
}: {
  courses: Course[];
  sessions: CourseSession[];
  tasks: OrganizerTask[];
  activeCourse: string | "all";
}) {
  const today = getToday();
  const CELL_HEIGHT = 56;
  const visibleSessions = activeCourse === "all" ? sessions : sessions.filter((s) => s.courseId === activeCourse);

  return (
    <div className="flex-1 overflow-auto scrollbar-hide p-4">
      <div style={{ minWidth: 700 }}>
        {/* Header Days */}
        <div className="grid gap-1 mb-2" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
          <div />
          {FULL_DAYS.map((d, i) => {
            const date = new Date(today);
            const todayMonIdx = (today.getDay() + 6) % 7;
            const diff = i - todayMonIdx;
            date.setDate(today.getDate() + diff);
            const isToday = date.toDateString() === today.toDateString();
            return (
              <div key={d} className={`text-center py-2 rounded-md border ${isToday ? "bg-[#4f7cff]/20 border-[#4f7cff]" : "bg-surface border-border"}`}>
                <p className={`text-[9px] font-mono uppercase ${isToday ? "text-[#4f7cff] font-bold" : "text-text-dim"}`}>{WEEK_DAYS[i]}</p>
                <p className={`text-[14px] font-bold ${isToday ? "text-[#4f7cff]" : "text-text"}`}>{date.getDate()}</p>
              </div>
            );
          })}
        </div>

        {/* Time Grid */}
        <div className="relative border border-border rounded-xl bg-surface/40 overflow-hidden">
          {HOURS.map((h) => (
            <div key={h} className="grid gap-1 border-b border-border/40" style={{ gridTemplateColumns: "56px repeat(7, 1fr)", height: CELL_HEIGHT }}>
              <div className="flex items-start justify-end pr-2 pt-1 border-r border-border">
                <span className="text-[9px] font-mono text-text-dim">{h}:00</span>
              </div>
              {FULL_DAYS.map((d) => (
                <div key={d} className="border-r border-border/20" />
              ))}
            </div>
          ))}

          {/* Absolute Overlays for Sessions and Tasks */}
          <div className="absolute inset-0 pointer-events-none grid" style={{ gridTemplateColumns: "56px repeat(7, 1fr)", gap: 0 }}>
            <div />
            {FULL_DAYS.map((_, di) => {
              const colDate = new Date(today);
              const todayMonIdx = (today.getDay() + 6) % 7;
              const diff = di - todayMonIdx;
              colDate.setDate(today.getDate() + diff);
              const dateStr = formatLocalDate(colDate);

              const daySessions = visibleSessions.filter((s) => s.dayOfWeek === di);
              const dayTasks = tasks.filter((t) => t.endDate === dateStr);

              // 1. Build item list for day di
              const dayItems: DayScheduleItem[] = [];

              daySessions.forEach((s) => {
                const course = courses.find((c) => c.id === s.courseId);
                const color = course?.color ?? "#4f7cff";
                const startHour = s.startHour;
                const duration = Math.max(0.5, s.duration);
                dayItems.push({
                  id: `session-${s.id}`,
                  kind: "session",
                  session: s,
                  course,
                  color,
                  startHour,
                  duration,
                  endHour: startHour + duration,
                  hasTime: true,
                  col: 0,
                  totalCols: 1,
                });
              });

              dayTasks.forEach((t) => {
                const course = courses.find((c) => c.id === t.courseId);
                const color = course?.color ?? CATEGORY_COLORS[t.type] ?? "#4f7cff";
                let startHour = 8;
                let hasTime = false;
                if (t.dueTime) {
                  const parts = t.dueTime.split(":");
                  const parsedH = parseInt(parts[0], 10);
                  const parsedM = parts[1] ? parseInt(parts[1], 10) : 0;
                  if (!isNaN(parsedH) && parsedH >= 8 && parsedH <= 22) {
                    startHour = parsedH + (isNaN(parsedM) ? 0 : parsedM / 60);
                    hasTime = true;
                  }
                }
                const duration = 0.85; // compact visual height for task
                dayItems.push({
                  id: `task-${t.id}`,
                  kind: "task",
                  task: t,
                  course,
                  color,
                  startHour,
                  duration,
                  endHour: startHour + duration,
                  hasTime,
                  col: 0,
                  totalCols: 1,
                });
              });

              // 2. Sort by startHour ascending, duration descending
              dayItems.sort((a, b) => {
                if (a.startHour !== b.startHour) return a.startHour - b.startHour;
                return b.duration - a.duration;
              });

              // 3. Assign sub-columns
              const colEndHours: number[] = [];
              dayItems.forEach((item) => {
                let placedCol = -1;
                for (let c = 0; c < colEndHours.length; c++) {
                  if (colEndHours[c] <= item.startHour + 0.01) {
                    placedCol = c;
                    colEndHours[c] = item.endHour;
                    break;
                  }
                }
                if (placedCol === -1) {
                  placedCol = colEndHours.length;
                  colEndHours.push(item.endHour);
                }
                item.col = placedCol;
              });

              // 4. Cluster connected overlapping items to assign totalCols
              const clusters: DayScheduleItem[][] = [];
              dayItems.forEach((item) => {
                let matchedCluster: DayScheduleItem[] | null = null;
                for (const cl of clusters) {
                  const overlaps = cl.some(
                    (other) => Math.max(item.startHour, other.startHour) < Math.min(item.endHour, other.endHour)
                  );
                  if (overlaps) {
                    if (!matchedCluster) {
                      matchedCluster = cl;
                      cl.push(item);
                    } else {
                      matchedCluster.push(...cl);
                      cl.length = 0;
                    }
                  }
                }
                if (!matchedCluster) {
                  clusters.push([item]);
                }
              });

              const activeClusters = clusters.filter((cl) => cl.length > 0);
              activeClusters.forEach((cl) => {
                const maxColInCluster = Math.max(...cl.map((i) => i.col));
                const totalCols = maxColInCluster + 1;
                cl.forEach((i) => {
                  i.totalCols = totalCols;
                });
              });

              return (
                <div key={di} className="relative border-r border-transparent">
                  {dayItems.map((item) => {
                    const widthPercent = 100 / item.totalCols;
                    const leftPercent = item.col * widthPercent;
                    const topPx = (item.startHour - 8) * CELL_HEIGHT;
                    const heightPx = Math.max(38, item.duration * CELL_HEIGHT - 2);

                    if (item.kind === "session" && item.session) {
                      const s = item.session;
                      const course = item.course;
                      const titleText = `${course?.name || "Curso"} (${s.type}): ${s.startHour}:00 - ${s.startHour + s.duration}:00`;

                      return (
                        <div
                          key={item.id}
                          title={titleText}
                          className="absolute rounded-md px-1.5 py-1 shadow-md overflow-hidden pointer-events-auto border transition-all hover:z-20 hover:scale-[1.02]"
                          style={{
                            top: topPx + 1,
                            height: heightPx,
                            left: `calc(${leftPercent}% + 2px)`,
                            width: `calc(${widthPercent}% - 4px)`,
                            backgroundColor: `${item.color}25`,
                            borderColor: `${item.color}80`,
                            borderLeft: `4px solid ${item.color}`,
                          }}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-[10px] font-mono font-bold truncate" style={{ color: item.color }}>
                              {course?.code}
                            </p>
                            <span className="text-[7.5px] font-mono px-1 rounded bg-background/60 text-text flex-shrink-0">
                              {s.type}
                            </span>
                          </div>
                          <p className="text-[10px] font-semibold text-text truncate mt-0.5">{course?.name}</p>
                          <p className="text-[8.5px] font-mono text-text-muted mt-0.5">
                            {s.startHour}:00 - {s.startHour + s.duration}:00
                          </p>
                        </div>
                      );
                    }

                    if (item.kind === "task" && item.task) {
                      const t = item.task;
                      const titleText = `${t.title} (${item.hasTime ? t.dueTime : "Sin hora"})`;

                      return (
                        <div
                          key={item.id}
                          title={titleText}
                          className="absolute rounded-md px-1.5 py-1 shadow-lg pointer-events-auto border transition-all hover:z-20 hover:scale-[1.02] bg-surface"
                          style={{
                            top: topPx + 1,
                            height: heightPx,
                            left: `calc(${leftPercent}% + 2px)`,
                            width: `calc(${widthPercent}% - 4px)`,
                            borderColor: item.color,
                            borderLeft: `4px solid ${item.color}`,
                          }}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[7.5px] font-mono px-1 rounded text-text flex-shrink-0" style={{ backgroundColor: `${item.color}40` }}>
                              {item.hasTime ? t.dueTime : "📍 Sin hora"}
                            </span>
                            <span className="text-[7.5px] font-mono text-text-muted truncate">{t.type}</span>
                          </div>
                          <p className="text-[9.5px] font-bold text-text truncate mt-0.5">{t.title}</p>
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
