import { useState } from "react";
import type { Activity, Member, Sprint, Priority, Status } from "../../types";
import { InlineText, InlineSelect, InlineSelectWithCreate, MultiMemberSelect } from "./InlineEditors";
import { parseLocalDate, isOverdue } from "../../utils/dateUtils";
import { PRIORITY_META, STATUS_META } from "../../constants/ui";
import { CountdownBadge } from "../shared/CountdownBadge";

export function TaskRow({
  task,
  sprints,
  members,
  categories,
  onUpdate,
  onDeleteTask,
  onCreateCategory,
  onCreateSprint,
}: {
  task: Activity;
  sprints: Sprint[];
  members: Member[];
  categories: string[];
  onUpdate: <K extends keyof Activity>(id: string, field: K, value: Activity[K]) => void;
  onDeleteTask?: (id: string) => void;
  onCreateCategory?: (name: string) => void;
  onCreateSprint?: (name: string) => Promise<Sprint | null>;
}) {
  const [editingCell, setEditingCell] = useState<string | null>(null);

  const isEditing = (field: string) => editingCell === field;
  const overdue = isOverdue(task.dueDate, task.status === "Completada");
  const sprint = sprints.find((s) => s.id === task.sprintId);

  const pMeta = PRIORITY_META[task.priority] || PRIORITY_META["Media"];
  const sMeta = STATUS_META[task.status] || STATUS_META["Pendiente"];

  const handleDoubleClick = (field: string) => {
    setEditingCell(field);
  };

  return (
    <tr className="border-b border-border hover:bg-panel-hover transition-colors group">


      {/* TAREA */}
      <td className="px-3 py-2 border-r border-border group/cell relative" onDoubleClick={() => handleDoubleClick("title")}>
        {isEditing("title") ? (
          <InlineText
            value={task.title}
            onCommit={(v) => { onUpdate(task.id, "title", v); setEditingCell(null); }}
            onBlur={() => setEditingCell(null)}
          />
        ) : (
          <span className="text-[12px] font-medium text-text cursor-pointer hover:text-[#4f7cff] transition-colors line-clamp-1">
            {task.title}
          </span>
        )}
      </td>

      {/* SPRINT */}
      <td className="px-3 py-2 border-r border-border group/cell relative" onDoubleClick={() => handleDoubleClick("sprintId")}>
        {isEditing("sprintId") ? (
          <InlineSelectWithCreate
            value={task.sprintId}
            options={sprints.map((s) => s.id)}
            labels={Object.fromEntries(sprints.map((s) => [s.id, s.name]))}
            createLabel="+ Nuevo Sprint..."
            onCreateNew={(name) => {
              if (!onCreateSprint) return;
              setEditingCell(null);
              void onCreateSprint(name).then((created) => {
                if (created) onUpdate(task.id, "sprintId", created.id);
              });
            }}
            onCommit={(v) => { onUpdate(task.id, "sprintId", v); setEditingCell(null); }}
            onBlur={() => setEditingCell(null)}
          />
        ) : (
          <span className="text-[11px] font-mono text-text-muted cursor-pointer hover:text-text transition-colors">
            {sprint?.name || <span className="text-text-dim">—</span>}
          </span>
        )}
      </td>

      {/* CATEGORÍA */}
      <td className="px-3 py-2 border-r border-border group/cell relative" onDoubleClick={() => handleDoubleClick("category")}>
        {isEditing("category") ? (
          <InlineSelectWithCreate
            value={task.category || ""}
            options={categories}
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
          <span className="text-[11px] font-mono text-text-muted cursor-pointer hover:text-text transition-colors">
            {task.category || <span className="text-text-dim">—</span>}
          </span>
        )}
      </td>

      {/* RESPONSABLE */}
      <td className="px-3 py-2 border-r border-border group/cell relative" onDoubleClick={() => handleDoubleClick("members")}>
        {isEditing("members") ? (
          <MultiMemberSelect
            value={task.members}
            members={members}
            onCommit={(v) => { onUpdate(task.id, "members", v); setEditingCell(null); }}
            onBlur={() => setEditingCell(null)}
          />
        ) : (
          <div className="flex -space-x-1 cursor-pointer">
            {(!task.members || task.members.length === 0) ? (
              <span className="text-text-dim">—</span>
            ) : (
              (task.members || []).map((id) => {
                const member = members.find((m) => m.id === id);
                if (!member) return null;
                return (
                  <div
                    key={member.id}
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white border border-surface"
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
      <td className="px-3 py-2 border-r border-border group/cell relative" onDoubleClick={() => handleDoubleClick("priority")}>
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
      <td className="px-3 py-2 border-r border-border group/cell relative" onDoubleClick={() => handleDoubleClick("status")}>
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
      <td className="px-3 py-2 border-r border-border group/cell relative" onDoubleClick={() => handleDoubleClick("hours")}>
        {isEditing("hours") ? (
          <InlineText
            value={String(task.hours || 0)}
            onCommit={(v) => { onUpdate(task.id, "hours", Math.max(0, Number(v) || 0)); setEditingCell(null); }}
            onBlur={() => setEditingCell(null)}
          />
        ) : (
          <span className="text-[11px] font-mono text-text-muted cursor-pointer hover:text-text transition-colors">
            {task.hours ? task.hours + "h" : <span className="text-text-dim">—</span>}
          </span>
        )}
      </td>

      {/* DEADLINE */}
      <td className="px-3 py-2 border-r border-border group/cell relative" onDoubleClick={() => handleDoubleClick("dueDate")}>
        {isEditing("dueDate") ? (
          <input
            autoFocus
            type="date"
            defaultValue={task.dueDate}
            onBlur={(e) => { onUpdate(task.id, "dueDate", e.target.value); setEditingCell(null); }}
            className="w-full bg-transparent text-[11px] font-mono text-text focus:outline-none"
          />
        ) : (
          <div className="flex flex-col items-start gap-1 cursor-pointer">
            {task.dueDate ? (
              <>
                <span className={`text-[11px] font-mono ${overdue ? "text-[#ff5c6a] font-semibold" : "text-text"}`}>
                  {(() => {
                    const d = parseLocalDate(task.dueDate);
                    return !isNaN(d.getTime())
                      ? d.toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "2-digit" })
                      : task.dueDate;
                  })()}
                </span>
                <CountdownBadge dateStr={task.dueDate} isDone={task.status === "Completada"} />
              </>
            ) : (
              <span className="text-text-dim">—</span>
            )}
          </div>
        )}
      </td>

      {/* NOTAS Y BORRAR */}
      <td className="px-3 py-2 group/cell relative" onDoubleClick={() => handleDoubleClick("description")}>
        <div className="flex items-center justify-between gap-2">
          {isEditing("description") ? (
            <InlineText
              value={task.description}
              onCommit={(v) => { onUpdate(task.id, "description", v); setEditingCell(null); }}
              onBlur={() => setEditingCell(null)}
            />
          ) : (
            <span className="text-[11px] text-text-muted cursor-pointer hover:text-text transition-colors line-clamp-1 flex-1">
              {task.description || <span className="text-text-dim">—</span>}
            </span>
          )}
          {onDeleteTask && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteTask(task.id);
              }}
              className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-[#ff5c6a] transition-all text-xs font-bold px-1"
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
