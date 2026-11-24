import { useMemo } from 'react';
import type { Project, Activity, Member, Status } from "../../types";
import { STATUS_META, PRIORITY_META } from "../../constants/ui";
import { isOverdue } from "../../utils/dateUtils";

/**
 * Distribuye porcentajes enteros usando el método de resto mayor (Hamilton)
 * para que la suma sea exactamente 100 cuando total > 0.
 */
function computeHamiltonPercents(counts: number[], total: number): number[] {
  const result = new Array<number>(counts.length).fill(0);
  if (total <= 0 || counts.length === 0) return result;

  const floors = counts.map((count) => Math.floor((count * 100) / total));
  const remainders = counts.map((count, index) => ({
    index,
    remainder: (count * 100) % total,
  }));
  const missing = 100 - floors.reduce((acc, val) => acc + val, 0);

  remainders.sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  for (let i = 0; i < floors.length; i++) {
    result[i] = floors[i];
  }
  for (let i = 0; i < missing; i++) {
    result[remainders[i].index] += 1;
  }
  return result;
}

export function StatsModal({ project, tasks, members, onClose }: {
  project: Project;
  tasks: Activity[];
  members: Member[];
  onClose: () => void;
}) {
  // Calcula la carga de horas por miembro actual y las horas sin asignar o de ex-miembros.
  const memberHours: Record<string, number> = {};
  const currentMemberIds = new Set(members.map((m) => m.id));
  let unassignedHours = 0;
  let grandTotalHours = 0;

  members.forEach((m) => { memberHours[m.id] = 0; });
  tasks.forEach((t) => {
    const hrs = Number(t.hours) || 0;
    grandTotalHours += hrs;
    if (!t.members || t.members.length === 0) {
      unassignedHours += hrs;
      return;
    }
    const portion = hrs / t.members.length;
    t.members.forEach((mid) => {
      if (currentMemberIds.has(mid)) {
        memberHours[mid] = (memberHours[mid] || 0) + portion;
      } else {
        unassignedHours += portion;
      }
    });
  });

  // Conteo de estados
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach(t => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return counts;
  }, [tasks]);
  
  const priorityCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach(t => {
      counts[t.priority] = (counts[t.priority] || 0) + 1;
    });
    return counts;
  }, [tasks]);

  const totalTasks = tasks.length;

  // Segmentos del gráfico circular y porcentajes redondeados a 100%
  const pieSegments = useMemo(() => {
    const entries = Object.entries(statusCounts);
    const roundedPercents = computeHamiltonPercents(
      entries.map(([, count]) => count),
      totalTasks
    );
    let cumulativePercent = 0;
    return entries.map(([status, count], index) => {
      const percent = totalTasks === 0 ? 0 : (count / totalTasks) * 100;
      const meta = STATUS_META[status as Status] || { color: 'var(--color-text-muted)' };
      const segment = {
        status,
        count,
        percent,
        roundedPercent: roundedPercents[index],
        strokeDasharray: `${percent} 100`,
        strokeDashoffset: -cumulativePercent,
        color: meta.color,
      };
      cumulativePercent += percent;
      return segment;
    });
  }, [statusCounts, totalTasks]);

  const doneCount = tasks.filter(t => t.status === "Completada").length;
  const overdueCount = tasks.filter(t => isOverdue(t.dueDate, t.status === "Completada")).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-surface rounded-xl shadow-2xl shadow-accent-blue/10 border border-border overflow-hidden flex flex-col max-h-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-surface/90 backdrop-blur z-10">
          <div>
            <h2 className="text-lg font-bold text-text">Estadísticas del Proyecto</h2>
            <p className="text-[11px] font-mono text-text-muted mt-1">{project.name}</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-accent-red transition-colors p-2 rounded-full hover:bg-panel-hover" title="Cerrar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Column: Charts and Priorities */}
          <div className="space-y-8">
            {/* Pie Chart */}
            <div className="bg-panel/50 rounded-xl p-5 border border-border">
              <h3 className="text-sm font-bold text-text mb-4">Estado de las Tareas</h3>
              <div className="flex items-center gap-6">
                <div className="w-32 h-32 relative flex-shrink-0">
                  <svg viewBox="0 0 32 32" className="w-full h-full transform -rotate-90 rounded-full">
                    <circle r="16" cx="16" cy="16" className="fill-surface" />
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
                      <circle r="16" cx="16" cy="16" fill="none" className="stroke-border" strokeWidth="32" />
                    )}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface m-4 rounded-full shadow-inner border border-border/50">
                     <span className="text-lg font-bold text-text">{totalTasks > 0 ? Math.round((doneCount/totalTasks)*100) : 0}%</span>
                     <span className="text-[8px] font-mono text-text-muted">Done</span>
                  </div>
                </div>
                
                {/* Legend */}
                <div className="flex-1 space-y-2">
                  {pieSegments.map(seg => (
                    <div key={seg.status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }}></span>
                        <span className="text-[11px] font-mono text-text">{seg.status}</span>
                      </div>
                      <span className="text-[11px] font-mono text-text-muted">{seg.count} ({seg.roundedPercent}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* General Highlights */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-panel/50 rounded-xl p-4 border border-border flex flex-col justify-center items-center text-center">
                <span className="text-3xl font-bold text-text">{totalTasks}</span>
                <span className="text-[10px] font-mono text-text-muted uppercase mt-2">Tareas Totales</span>
              </div>
              <div className="bg-accent-red/10 rounded-xl p-4 border border-accent-red/30 flex flex-col justify-center items-center text-center">
                <span className="text-3xl font-bold text-accent-red">{overdueCount}</span>
                <span className="text-[10px] font-mono text-accent-red uppercase mt-2">Atrasadas</span>
              </div>
            </div>

          </div>

          {/* Right Column: Priorities and Hours */}
          <div className="space-y-8">
            {/* Priority Distribution */}
            <div className="bg-panel/50 rounded-xl p-5 border border-border">
              <h3 className="text-sm font-bold text-text mb-4">Por Prioridad</h3>
              <div className="space-y-3">
                {Object.entries(PRIORITY_META).map(([prio, meta]) => {
                  const count = priorityCounts[prio] || 0;
                  const pct = totalTasks > 0 ? (count / totalTasks) * 100 : 0;
                  return (
                    <div key={prio}>
                      <div className="flex justify-between text-[11px] font-mono mb-1.5">
                        <span style={{ color: meta.color }}>{prio}</span>
                        <span className="text-text-muted">{count} ({Math.round(pct)}%)</span>
                      </div>
                      <div className="h-2 w-full bg-surface rounded-full overflow-hidden border border-border/50">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: meta.color }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Resumen de Horas */}
            <div className="bg-panel/50 rounded-xl p-5 border border-border">
              <h3 className="text-sm font-bold text-text mb-4">Carga de Horas</h3>
              <div className="w-full border border-border rounded overflow-hidden">
                <table className="w-full text-[12px] text-left border-collapse">
                  <thead>
                    <tr className="bg-accent-blue text-white">
                      <th className="px-4 py-2.5 font-medium border-b border-border">Encargado</th>
                      <th className="px-4 py-2.5 font-medium border-b border-border text-right">Horas</th>
                    </tr>
                  </thead>
                  <tbody className="bg-surface">
                    {members.map((m) => (
                      <tr key={m.id} className="border-b border-border/50">
                        <td className="px-4 py-2 text-text flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white border border-border" style={{ backgroundColor: m.avatarColor }}>
                            {m.initials}
                          </span>
                          {m.name} {m.lastName}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-text">{Number((memberHours[m.id] || 0).toFixed(1))}h</td>
                      </tr>
                    ))}
                    {unassignedHours > 0 && (
                      <tr className="border-b border-border/50">
                        <td className="px-4 py-2 text-text-muted flex items-center gap-2 italic">
                          <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-text-muted border border-dashed border-border bg-panel">
                            ?
                          </span>
                          Sin asignar / Otros
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-text-muted">
                          {Number(unassignedHours.toFixed(1))}h
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-panel font-bold border-t border-border">
                    <tr>
                      <td className="px-4 py-2.5 text-text">Total del Proyecto</td>
                      <td className="px-4 py-2.5 text-right font-mono text-text">{Number(grandTotalHours.toFixed(1))}h</td>
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
