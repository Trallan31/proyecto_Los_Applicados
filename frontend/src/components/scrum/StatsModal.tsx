import { useMemo } from 'react';
import type { Project } from "../../types/projects";
import type { Status } from "../../types/activities";
import { STATUS_META, PRIORITY_META } from "../../data/mockScrum";

export function StatsModal({ project, onClose }: { project: Project; onClose: () => void }) {
  // calculate hours
  const memberHours: Record<string | number, number> = {};
  let grandTotalHours = 0;
  
  project.members.forEach((m) => { memberHours[m.id] = 0; });
  project.tasks.forEach((t) => {
    const hrs = Number(t.hours) || 0;
    grandTotalHours += hrs;
    if (t.members && t.members.length > 0) {
      const portion = hrs / t.members.length;
      t.members.forEach((mid) => {
        memberHours[mid] = (memberHours[mid] || 0) + portion;
      });
    }
  });

  // Calculate status pie chart
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    project.tasks.forEach(t => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return counts;
  }, [project.tasks]);
  
  const priorityCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    project.tasks.forEach(t => {
      counts[t.priority] = (counts[t.priority] || 0) + 1;
    });
    return counts;
  }, [project.tasks]);

  const totalTasks = project.tasks.length;
  
  // Pie chart calculation
  let cumulativePercent = 0;
  const pieSegments = Object.entries(statusCounts).map(([status, count]) => {
    const percent = totalTasks === 0 ? 0 : (count / totalTasks) * 100;
    const meta = STATUS_META[status as Status] || { color: '#7c82a0' };
    const segment = {
      status,
      count,
      percent,
      strokeDasharray: `${percent} 100`,
      strokeDashoffset: -cumulativePercent,
      color: meta.color
    };
    cumulativePercent += percent;
    return segment;
  });

  const doneCount = project.tasks.filter(t => t.status === "Completada").length;
  const overdueCount = project.tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "Completada").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-[#151820] rounded-xl shadow-2xl shadow-[#4f7cff]/10 border border-[#2a2f45] overflow-hidden flex flex-col max-h-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2a2f45] flex items-center justify-between sticky top-0 bg-[#151820]/90 backdrop-blur z-10">
          <div>
            <h2 className="text-lg font-bold text-[#e8eaf2]">Estadísticas del Proyecto</h2>
            <p className="text-[11px] font-mono text-[#7c82a0] mt-1">{project.name}</p>
          </div>
          <button onClick={onClose} className="text-[#7c82a0] hover:text-[#ff5c6a] transition-colors p-2 rounded-full hover:bg-[#2a2f45]" title="Cerrar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Column: Charts and Priorities */}
          <div className="space-y-8">
            {/* Pie Chart */}
            <div className="bg-[#1c2030]/50 rounded-xl p-5 border border-[#2a2f45]">
              <h3 className="text-sm font-bold text-[#e8eaf2] mb-4">Estado de las Tareas</h3>
              <div className="flex items-center gap-6">
                <div className="w-32 h-32 relative flex-shrink-0">
                  <svg viewBox="0 0 32 32" className="w-full h-full transform -rotate-90 rounded-full">
                    <circle r="16" cx="16" cy="16" fill="#151820" />
                    {totalTasks > 0 ? pieSegments.map((seg, i) => (
                      <circle
                        key={i}
                        r="16"
                        cx="16"
                        cy="16"
                        fill="none"
                        stroke={seg.color}
                        strokeWidth="32"
                        strokeDasharray={seg.strokeDasharray}
                        strokeDashoffset={seg.strokeDashoffset}
                      />
                    )) : (
                      <circle r="16" cx="16" cy="16" fill="none" stroke="#2a2f45" strokeWidth="32" />
                    )}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#151820] m-4 rounded-full shadow-inner border border-[#2a2f45]/50">
                     <span className="text-lg font-bold text-white">{totalTasks > 0 ? Math.round((doneCount/totalTasks)*100) : 0}%</span>
                     <span className="text-[8px] font-mono text-[#7c82a0]">Done</span>
                  </div>
                </div>
                
                {/* Legend */}
                <div className="flex-1 space-y-2">
                  {pieSegments.map(seg => (
                    <div key={seg.status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }}></span>
                        <span className="text-[11px] font-mono text-[#e8eaf2]">{seg.status}</span>
                      </div>
                      <span className="text-[11px] font-mono text-[#7c82a0]">{seg.count} ({Math.round(seg.percent)}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* General Highlights */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#1c2030]/50 rounded-xl p-4 border border-[#2a2f45] flex flex-col justify-center items-center text-center">
                <span className="text-3xl font-bold text-[#e8eaf2]">{totalTasks}</span>
                <span className="text-[10px] font-mono text-[#7c82a0] uppercase mt-2">Tareas Totales</span>
              </div>
              <div className="bg-[#ff5c6a]/10 rounded-xl p-4 border border-[#ff5c6a]/30 flex flex-col justify-center items-center text-center">
                <span className="text-3xl font-bold text-[#ff5c6a]">{overdueCount}</span>
                <span className="text-[10px] font-mono text-[#ff5c6a] uppercase mt-2">Atrasadas</span>
              </div>
            </div>

          </div>

          {/* Right Column: Priorities and Hours */}
          <div className="space-y-8">
            {/* Priority Distribution */}
            <div className="bg-[#1c2030]/50 rounded-xl p-5 border border-[#2a2f45]">
              <h3 className="text-sm font-bold text-[#e8eaf2] mb-4">Por Prioridad</h3>
              <div className="space-y-3">
                {Object.entries(PRIORITY_META).map(([prio, meta]) => {
                  const count = priorityCounts[prio] || 0;
                  const pct = totalTasks > 0 ? (count / totalTasks) * 100 : 0;
                  return (
                    <div key={prio}>
                      <div className="flex justify-between text-[11px] font-mono mb-1.5">
                        <span style={{ color: meta.color }}>{prio}</span>
                        <span className="text-[#7c82a0]">{count} ({Math.round(pct)}%)</span>
                      </div>
                      <div className="h-2 w-full bg-[#151820] rounded-full overflow-hidden border border-[#2a2f45]/50">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: meta.color }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Resumen de Horas */}
            <div className="bg-[#1c2030]/50 rounded-xl p-5 border border-[#2a2f45]">
              <h3 className="text-sm font-bold text-[#e8eaf2] mb-4">Carga de Horas</h3>
              <div className="w-full border border-[#2a2f45] rounded overflow-hidden">
                <table className="w-full text-[12px] text-left border-collapse">
                  <thead>
                    <tr className="bg-[#4f7cff] text-white">
                      <th className="px-4 py-2.5 font-medium border-b border-[#2a2f45]">Encargado</th>
                      <th className="px-4 py-2.5 font-medium border-b border-[#2a2f45] text-right">Horas</th>
                    </tr>
                  </thead>
                  <tbody className="bg-[#151820]">
                    {project.members.map((m) => (
                      <tr key={m.id} className="border-b border-[#2a2f45]/50">
                        <td className="px-4 py-2 text-[#e8eaf2] flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white border border-[#2a2f45]" style={{ backgroundColor: m.avatarColor }}>
                            {m.initials}
                          </span>
                          {m.name} {m.lastName}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-[#e8eaf2]">{Number((memberHours[m.id] || 0).toFixed(1))}h</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-[#2a2f45] font-bold">
                    <tr>
                      <td className="px-4 py-2.5 text-white">Total del Proyecto</td>
                      <td className="px-4 py-2.5 text-right font-mono text-white">{Number(grandTotalHours.toFixed(1))}h</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
