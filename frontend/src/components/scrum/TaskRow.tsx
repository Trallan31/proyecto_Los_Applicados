import { useState } from "react";
import type { Activity, Priority, Status } from "../../types/activities";
import type { Project } from "../../types/projects";
import type { Sprint } from "../../types/sprints";
import { InlineText, InlineSelect, InlineSelectWithCreate, MultiMemberSelect } from "./InlineEditors";

export function TaskRow({
  task,
  project,
  ALL_SPRINTS,
  PRIORITY_META,
  STATUS_META,
  onUpdate,
  onDeleteTask,
  onCreateCategory,
  onCreateSprint,
  cell,
}: {
  task: Activity;
  project: Project;
  ALL_SPRINTS: Sprint[];
  PRIORITY_META: Record<Priority, { color: string; bg: string }>;
  STATUS_META: Record<Status, { color: string; bg: string; dot: string }>;
  onUpdate: <K extends keyof Activity>(id: string | number, field: K, value: Activity[K]) => void;
  onDeleteTask?: (id: string | number) => void;
  onCreateCategory?: (name: string) => void;
  onCreateSprint?: (name: string) => Sprint;
  cell: (field: string) => React.TdHTMLAttributes<HTMLTableCellElement>;
}) {
  const [editingCell, setEditingCell] = useState<string | null>(null);

  const isEditing = (field: string) => editingCell === field;
  const isOverdue = task.dueDate ? new Date(task.dueDate) < new Date() && task.status !== "Completada" : false;
  const sprint = ALL_SPRINTS.find((s) => s.id === task.sprintId);

  const pMeta = PRIORITY_META[task.priority] || PRIORITY_META["Media"];
  const sMeta = STATUS_META[task.status] || STATUS_META["Pendiente"];

  const handleDoubleClick = (field: string) => {
    setEditingCell(field);
  };

  const augmentedCell = (field: string) => ({
    ...cell(field),
    onDoubleClick: () => handleDoubleClick(field),
    onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === 'F2') { e.preventDefault(); handleDoubleClick(field); } },
    tabIndex: 0,
    role: 'gridcell' as const,
  });

  return (
    <tr className="border-b border-[#2a2f45] hover:bg-[#1c2030] transition-colors group">


      {/* TAREA */}
      <td className="px-3 py-0 border-r border-[#2a2f45] h-9" {...augmentedCell("title")}>
        {isEditing("title") ? (
          <InlineText
            value={task.title}
            onCommit={(v) => { onUpdate(task.id, "title", v); setEditingCell(null); }}
            onBlur={() => setEditingCell(null)}
          />
        ) : (
          <span className="text-[12px] font-medium text-[#e8eaf2] cursor-pointer hover:text-[#4f7cff] transition-colors line-clamp-1">
            {task.title}
          </span>
        )}
      </td>

      {/* SPRINT */}
      <td className="px-3 py-0 border-r border-[#2a2f45] h-9" {...augmentedCell("sprintId")}>
        {isEditing("sprintId") ? (
          <InlineSelectWithCreate
            value={task.sprintId}
            options={ALL_SPRINTS.filter(s => s.projectId === project.id).map((s) => s.id)}
            labels={Object.fromEntries(ALL_SPRINTS.filter(s => s.projectId === project.id).map((s) => [s.id, s.name]))}
            createLabel="+ Nuevo Sprint..."
            onCreateNew={(name) => {
              if (onCreateSprint) {
                const newS = onCreateSprint(name);
                onUpdate(task.id, "sprintId", newS.id);
                setEditingCell(null);
              }
            }}
            onCommit={(v) => { onUpdate(task.id, "sprintId", Number(v)); setEditingCell(null); }}
            onBlur={() => setEditingCell(null)}
          />
        ) : (
          <span className="text-[11px] font-mono text-[#7c82a0] cursor-pointer hover:text-[#e8eaf2] transition-colors">
            {sprint?.name || <span className="text-[#2a2f45]">—</span>}
          </span>
        )}
      </td>

      {/* CATEGORÍA */}
      <td className="px-3 py-0 border-r border-[#2a2f45] h-9" {...augmentedCell("category")}>
        {isEditing("category") ? (
          <InlineSelectWithCreate
            value={task.category || ""}
            options={project.categories}
            createLabel="+ Nueva categoría..."
            onCreateNew={(name) => {
              if (onCreateCategory) onCreateCategory(name);
              onUpdate(task.id, "category", name);
              setEditingCell(null);
            }}
            onCommit={(v) => { onUpdate(task.id, "category", v); setEditingCell(null); }}
            onBlur={() => setEditingCell(null)}
          />
        ) : (
          <span className="text-[11px] font-mono text-[#7c82a0] cursor-pointer hover:text-[#e8eaf2] transition-colors">
            {task.category || <span className="text-[#2a2f45]">—</span>}
          </span>
        )}
      </td>

      {/* RESPONSABLE */}
      <td className="px-3 py-0 border-r border-[#2a2f45] h-9 relative" {...augmentedCell("members")}>
        {isEditing("members") ? (
          <MultiMemberSelect
            value={task.members}
            members={project.members}
            onCommit={(v) => { onUpdate(task.id, "members", v); setEditingCell(null); }}
            onBlur={() => setEditingCell(null)}
          />
        ) : (
          <div className="flex -space-x-1 cursor-pointer">
            {(!task.members || task.members.length === 0) ? (
              <span className="text-[#2a2f45]">—</span>
            ) : (
              (task.members || []).map((id) => {
                const member = project.members.find((m) => m.id === id);
                if (!member) return null;
                return (
                  <div
                    key={member.id}
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white border border-[#151820]"
                    style={{ backgroundColor: member.avatarColor }}
                    title={member.name}
                  >
                    {member.initials}
                  </div>
                );
              })
            )}
          </div>
        )}
      </td>

      {/* PRIORIDAD */}
      <td className="px-3 py-0 border-r border-[#2a2f45] h-9" {...augmentedCell("priority")}>
        {isEditing("priority") ? (
          <InlineSelect
            value={task.priority}
            options={Object.keys(PRIORITY_META)}
            onCommit={(v) => { onUpdate(task.id, "priority", v as Priority); setEditingCell(null); }}
            onBlur={() => setEditingCell(null)}
          />
        ) : (
          <span
            className="inline-flex items-center text-[10px] font-mono px-2 py-0.5 rounded cursor-pointer"
            style={{ color: pMeta.color, backgroundColor: pMeta.bg }}
          >
            {task.priority}
          </span>
        )}
      </td>

      {/* ESTADO */}
      <td className="px-3 py-0 border-r border-[#2a2f45] h-9" {...augmentedCell("status")}>
        {isEditing("status") ? (
          <InlineSelect
            value={task.status}
            options={Object.keys(STATUS_META)}
            onCommit={(v) => { onUpdate(task.id, "status", v as Status); setEditingCell(null); }}
            onBlur={() => setEditingCell(null)}
          />
        ) : (
          <span
            className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded cursor-pointer"
            style={{ color: sMeta.color, backgroundColor: sMeta.bg }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sMeta.dot }} />
            {task.status}
          </span>
        )}
      </td>

      {/* HORAS */}
      <td className="px-3 py-0 border-r border-[#2a2f45] h-9" {...augmentedCell("hours")}>
        {isEditing("hours") ? (
          <InlineText
            value={String(task.hours || 0)}
            onCommit={(v) => { onUpdate(task.id, "hours", Math.max(0, Number(v) || 0)); setEditingCell(null); }}
            onBlur={() => setEditingCell(null)}
          />
        ) : (
          <span className="text-[11px] font-mono text-[#7c82a0] cursor-pointer hover:text-[#e8eaf2] transition-colors">
            {task.hours ? task.hours + "h" : <span className="text-[#2a2f45]">—</span>}
          </span>
        )}
      </td>

      {/* DEADLINE */}
      <td className="px-3 py-0 border-r border-[#2a2f45] h-9" {...augmentedCell("dueDate")}>
        {isEditing("dueDate") ? (
          <input
            autoFocus
            type="date"
            defaultValue={task.dueDate}
            onBlur={(e) => { onUpdate(task.id, "dueDate", e.target.value); setEditingCell(null); }}
            className="w-full bg-transparent text-[11px] font-mono text-[#e8eaf2] focus:outline-none"
          />
        ) : (
          <span className={`text-[11px] font-mono cursor-pointer ${isOverdue ? "text-[#ff5c6a]" : "text-[#7c82a0]"}`}>
            {(() => {
              if (!task.dueDate) return <span className="text-[#2a2f45]">—</span>;
              const d = new Date(task.dueDate + "T00:00:00");
              return !isNaN(d.getTime())
                ? d.toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "2-digit" })
                : <span className="text-[#2a2f45]">—</span>;
            })()}
          </span>
        )}
      </td>

      {/* NOTAS Y BORRAR */}
      <td className="px-3 py-0 border-r border-[#2a2f45] h-9" {...augmentedCell("description")}>
        <div className="flex items-center justify-between gap-2">
          {isEditing("description") ? (
            <InlineText
              value={task.description}
              onCommit={(v) => { onUpdate(task.id, "description", v); setEditingCell(null); }}
              onBlur={() => setEditingCell(null)}
            />
          ) : (
            <span className="text-[11px] text-[#7c82a0] cursor-pointer hover:text-[#e8eaf2] transition-colors line-clamp-1 flex-1">
              {task.description || <span className="text-[#2a2f45]">—</span>}
            </span>
          )}
          {onDeleteTask && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteTask(task.id);
              }}
              className="opacity-0 group-hover:opacity-100 text-[#7c82a0] hover:text-[#ff5c6a] transition-all text-xs font-bold px-1"
              title="Eliminar tarea"
              aria-label="Eliminar tarea"
            >
              ✕
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
