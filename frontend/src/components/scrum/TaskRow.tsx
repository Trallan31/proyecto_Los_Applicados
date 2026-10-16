import { useState } from "react";
import type { Activity, Member, Sprint, Priority, Status } from "../../types";
import { InlineText, InlineDate, InlineSelect, InlineSelectWithCreate, MultiMemberSelect } from "./InlineEditors";
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
  const [editingCell, setEditingCell] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const targetId = params.get("editTaskId") || "activity-1";
      if (task.id === targetId) {
        return params.get("editField") || params.get("edit") || null;
      }
    }
    return null;
  });

  const isEditing = (field: string) => editingCell === field;
  const overdue = isOverdue(task.dueDate, task.status === "Completada");
  const sprint = sprints.find((s) => s.id === task.sprintId);

  const pMeta = PRIORITY_META[task.priority] || PRIORITY_META["Media"];
  const sMeta = STATUS_META[task.status] || STATUS_META["Pendiente"];

  const handleDoubleClick = (field: string) => {
    setEditingCell(field);
  };

  const handleCellKeyDown = (e: React.KeyboardEvent, field: string) => {
    if (editingCell) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setEditingCell(field);
    }
  };

  const cellFocusClasses = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-inset";

  return (
    <tr className="border-b border-border hover:bg-panel-hover transition-colors group">


      {/* TAREA */}
      <td
        tabIndex={0}
        role="gridcell"
        aria-label={`Editar título de la tarea ${task.title}`}
        className={`px-3 py-2 border-r border-border group/cell relative cursor-pointer ${cellFocusClasses}`}
        onDoubleClick={() => handleDoubleClick("title")}
        onKeyDown={(e) => handleCellKeyDown(e, "title")}
      >
        {isEditing("title") ? (
          <InlineText
            value={task.title}
            onCommit={(v) => { onUpdate(task.id, "title", v); setEditingCell(null); }}
            onBlur={() => setEditingCell(null)}
          />
        ) : (
          <span className="text-[12px] font-medium text-text cursor-pointer hover:text-accent-blue transition-colors line-clamp-1">
            {task.title}
          </span>
        )}
      </td>

      {/* SPRINT */}
      <td
        tabIndex={0}
        role="gridcell"
        aria-label={`Editar sprint de la tarea ${task.title}`}
        className={`px-3 py-2 border-r border-border group/cell relative cursor-pointer ${cellFocusClasses}`}
        onClick={() => handleDoubleClick("sprintId")}
        onDoubleClick={() => handleDoubleClick("sprintId")}
        onKeyDown={(e) => handleCellKeyDown(e, "sprintId")}
      >
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
          sprint ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-panel border border-border text-text hover:border-accent-blue hover:text-accent-blue transition-all cursor-pointer">
              {sprint.name}
            </span>
          ) : (
            <span className="text-text-dim font-mono text-[11px] cursor-pointer">—</span>
          )
        )}
      </td>

      {/* CATEGORÍA */}
      <td
        tabIndex={0}
        role="gridcell"
        aria-label={`Editar categoría de la tarea ${task.title}`}
        className={`px-3 py-2 border-r border-border group/cell relative cursor-pointer ${cellFocusClasses}`}
        onClick={() => handleDoubleClick("category")}
        onDoubleClick={() => handleDoubleClick("category")}
        onKeyDown={(e) => handleCellKeyDown(e, "category")}
      >
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
          task.category ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-surface border border-border text-text-muted hover:text-text hover:border-border-bright transition-all cursor-pointer">
              {task.category}
            </span>
          ) : (
            <span className="text-text-dim font-mono text-[11px] cursor-pointer">—</span>
          )
        )}
      </td>

      {/* RESPONSABLE */}
      <td
        tabIndex={0}
        role="gridcell"
        aria-label={`Editar responsables de la tarea ${task.title}`}
        className={`px-3 py-2 border-r border-border group/cell relative cursor-pointer ${cellFocusClasses}`}
        onClick={() => handleDoubleClick("members")}
        onDoubleClick={() => handleDoubleClick("members")}
        onKeyDown={(e) => handleCellKeyDown(e, "members")}
      >
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
              <span className="text-text-dim cursor-pointer">—</span>
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
      <td
        tabIndex={0}
        role="gridcell"
        aria-label={`Editar prioridad de la tarea ${task.title}`}
        className={`px-3 py-2 border-r border-border group/cell relative cursor-pointer ${cellFocusClasses}`}
        onClick={() => handleDoubleClick("priority")}
        onDoubleClick={() => handleDoubleClick("priority")}
        onKeyDown={(e) => handleCellKeyDown(e, "priority")}
      >
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
      <td
        tabIndex={0}
        role="gridcell"
        aria-label={`Editar estado de la tarea ${task.title}`}
        className={`px-3 py-2 border-r border-border group/cell relative cursor-pointer ${cellFocusClasses}`}
        onClick={() => handleDoubleClick("status")}
        onDoubleClick={() => handleDoubleClick("status")}
        onKeyDown={(e) => handleCellKeyDown(e, "status")}
      >
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
      <td
        tabIndex={0}
        role="gridcell"
        aria-label={`Editar horas de la tarea ${task.title}`}
        className={`px-3 py-2 border-r border-border group/cell relative cursor-pointer ${cellFocusClasses}`}
        onDoubleClick={() => handleDoubleClick("hours")}
        onKeyDown={(e) => handleCellKeyDown(e, "hours")}
      >
        {isEditing("hours") ? (
          <InlineText
            value={String(task.hours || 0)}
            onCommit={(v) => { onUpdate(task.id, "hours", Math.max(0, Number(v) || 0)); setEditingCell(null); }}
            onBlur={() => setEditingCell(null)}
          />
        ) : (
          <span className="text-[11px] font-mono font-medium text-text cursor-pointer hover:text-accent-blue transition-colors">
            {task.hours ? task.hours + "h" : <span className="text-text-dim font-normal cursor-pointer">—</span>}
          </span>
        )}
      </td>

      {/* DEADLINE */}
      <td
        tabIndex={0}
        role="gridcell"
        aria-label={`Editar deadline de la tarea ${task.title}`}
        className={`px-3 py-2 border-r border-border group/cell relative cursor-pointer ${cellFocusClasses}`}
        onClick={() => handleDoubleClick("dueDate")}
        onDoubleClick={() => handleDoubleClick("dueDate")}
        onKeyDown={(e) => handleCellKeyDown(e, "dueDate")}
      >
        {isEditing("dueDate") ? (
          <InlineDate
            value={task.dueDate}
            onCommit={(v) => { onUpdate(task.id, "dueDate", v); setEditingCell(null); }}
            onBlur={() => setEditingCell(null)}
          />
        ) : (
          <div className="flex items-center justify-end gap-1.5 cursor-pointer whitespace-nowrap">
            {task.dueDate ? (
              <>
                <span className={`text-[11px] font-mono font-medium shrink-0 ${overdue ? "text-accent-red font-semibold" : task.status === "Completada" ? "text-text-muted" : "text-text"}`}>
                  {(() => {
                    const d = parseLocalDate(task.dueDate);
                    return !isNaN(d.getTime())
                      ? d.toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "2-digit" })
                      : task.dueDate;
                  })()}
                </span>
                {task.status !== "Completada" && (
                  <CountdownBadge dateStr={task.dueDate} compact />
                )}
              </>
            ) : (
              <span className="text-text-dim font-normal cursor-pointer">—</span>
            )}
          </div>
        )}
      </td>

      {/* NOTAS Y BORRAR */}
      <td
        tabIndex={0}
        role="gridcell"
        aria-label={`Editar notas de la tarea ${task.title}`}
        className={`px-3 py-2 group/cell relative cursor-pointer ${cellFocusClasses}`}
        onDoubleClick={() => handleDoubleClick("description")}
        onKeyDown={(e) => handleCellKeyDown(e, "description")}
      >
        <div className="flex items-center justify-between gap-2">
          {isEditing("description") ? (
            <InlineText
              value={task.description}
              onCommit={(v) => { onUpdate(task.id, "description", v); setEditingCell(null); }}
              onBlur={() => setEditingCell(null)}
            />
          ) : (
            <span className="text-[11px] text-text-muted cursor-pointer hover:text-text transition-colors line-clamp-1 flex-1">
              {task.description || <span className="text-text-dim cursor-pointer">—</span>}
            </span>
          )}
          {onDeleteTask && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteTask(task.id);
              }}
              className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-accent-red transition-all text-xs font-bold px-1"
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
