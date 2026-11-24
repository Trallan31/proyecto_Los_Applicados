import { useEffect, useState } from "react";
import { GripVertical } from "lucide-react";
import type { Activity, Member, Sprint, Priority, Status } from "../../types";
import { InlineText, InlineDate, InlineSelect, InlineSelectWithCreate, MultiMemberSelect } from "./InlineEditors";
import { parseLocalDate, isOverdue } from "../../utils/dateUtils";
import { PRIORITY_META, STATUS_META } from "../../constants/ui";
import { CountdownBadge } from "../shared/CountdownBadge";
import { useLocation, useNavigate } from "react-router-dom";

export function TaskRow({
  task,
  sprints,
  members,
  categories,
  onUpdate,
  onDeleteTask,
  onCreateCategory,
  onCreateSprint,
  isDragging = false,
  isDropTarget = false,
  onDragStartTask,
  onDragEnterTask,
  onDropTask,
  onDragEndTask,
  onTouchDragStart,
  onMoveTask,
}: {
  task: Activity;
  sprints: Sprint[];
  members: Member[];
  categories: string[];
  onUpdate: <K extends keyof Activity>(id: string, field: K, value: Activity[K]) => void;
  onDeleteTask?: (id: string) => void;
  onCreateCategory?: (name: string) => void;
  onCreateSprint?: (name: string) => Promise<Sprint | null>;
  /** La fila es la que se esta arrastrando. */
  isDragging?: boolean;
  /** La fila es el lugar donde se soltaria la tarea arrastrada. */
  isDropTarget?: boolean;
  onDragStartTask?: () => void;
  onDragEnterTask?: () => void;
  /** Recibe el id de la tarea arrastrada, que viaja en el dataTransfer. */
  onDropTask?: (draggedTaskId: string) => void;
  onDragEndTask?: () => void;
  /** Arrastre con el dedo: el navegador no emite eventos de drag en tactil. */
  onTouchDragStart?: () => void;
  /** Mueve la fila delta posiciones (teclado: flechas sobre el tirador). */
  onMoveTask?: (delta: number) => void;
}) {
  const [editingCell, setEditingCell] = useState<string | null>(null);
  // La fila solo es arrastrable mientras se sostiene el tirador: asi editar
  // celdas o seleccionar texto sigue funcionando igual que antes.
  const [dragEnabled, setDragEnabled] = useState(false);

  const isEditing = (field: string) => editingCell === field;
  const overdue = isOverdue(task.dueDate, task.status === "Completada");
  const sprint = sprints.find((s) => s.id === task.sprintId);

  const pMeta = PRIORITY_META[task.priority] || PRIORITY_META["Media"];
  const sMeta = STATUS_META[task.status] || STATUS_META["Pendiente"];

  const location = useLocation();
  const navigate = useNavigate();
  const isHighlighted = (location.state as { taskId?: string } | null)?.taskId === task.id;

  useEffect(() => {
    if (!isHighlighted) return;

    const timeout = setTimeout(() => {
      navigate({ pathname: location.pathname, search: location.search }, { replace: true, state: null });
    }, 1000);

    return () => clearTimeout(timeout);
  }, [isHighlighted, navigate, location.pathname, location.search]);

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
    <tr
      data-task-id={task.id}
      draggable={dragEnabled}
      onDragStart={(e) => {
        // El id viaja en el evento: asi la fila destino sabe que se solto
        // sobre ella sin depender del estado de la fila de origen.
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", task.id);
        onDragStartTask?.();
      }}
      onDragEnter={() => onDragEnterTask?.()}
      onDragOver={(e) => {
        // Sin preventDefault el navegador no permite soltar sobre la fila.
        if (!onDropTask) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragEnabled(false);
        onDropTask?.(e.dataTransfer.getData("text/plain"));
      }}
      onDragEnd={() => {
        setDragEnabled(false);
        onDragEndTask?.();
      }}
      className={`border-b border-border hover:bg-panel-hover transition-colors group ${
        isDragging ? "opacity-40" : ""
      } ${isDropTarget ? "outline outline-2 -outline-offset-2 outline-accent-blue" : ""
      } duration-500 ${isHighlighted ? "bg-accent-blue/20" : ""}`}
    >
      {/* TIRADOR PARA REORDENAR */}
      <td className="px-1 py-1 border-r border-border align-middle">
        <button
          type="button"
          title="Arrastra para reordenar"
          aria-label={`Reordenar la tarea ${task.title}: arrastra el tirador o usa las flechas arriba y abajo`}
          onPointerDown={(e) => {
            if (e.pointerType === "mouse") {
              // Con raton arrastra el navegador (drag & drop nativo).
              setDragEnabled(true);
              return;
            }
            // Con el dedo o el lapiz no hay eventos de drag nativos:
            // el tablero sigue el puntero por su cuenta.
            e.preventDefault();
            onTouchDragStart?.();
          }}
          onPointerUp={() => setDragEnabled(false)}
          onPointerCancel={() => setDragEnabled(false)}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp") {
              e.preventDefault();
              onMoveTask?.(-1);
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              onMoveTask?.(1);
            }
          }}
          className="w-full h-8 flex items-center justify-center rounded text-text-dim hover:text-accent-blue cursor-grab active:cursor-grabbing touch-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
      </td>

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
            onCommit={(v) => {
              const trimmed = v.trim();
              if (trimmed && trimmed !== task.title) {
                onUpdate(task.id, "title", trimmed);
              }
              setEditingCell(null);
            }}
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
            onCommit={(v) => {
              const parsed = Number(v);
              const safeHours = Number.isFinite(parsed)
                ? Math.min(10000, Math.max(0, parsed))
                : task.hours;
              onUpdate(task.id, "hours", safeHours);
              setEditingCell(null);
            }}
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
            onCommit={(v) => {
              if (v && !Number.isNaN(parseLocalDate(v).getTime()) && v !== task.dueDate) {
                onUpdate(task.id, "dueDate", v);
              }
              setEditingCell(null);
            }}
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
