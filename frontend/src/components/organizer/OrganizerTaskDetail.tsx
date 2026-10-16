import { useEffect } from "react";
import type { OrganizerTask, Course } from "../../types";
import { CATEGORY_COLORS, PRIORITY_META, STATUS_META } from "../../constants/ui";
import { parseLocalDate } from "../../utils/dateUtils";
import { CountdownBadge } from "../shared/CountdownBadge";
import {
  BookOpen,
  Calendar,
  Check,
  FileText,
  Flag,
  Hash,
  Pencil,
  Tag,
  Trash2,
  User,
  X,
} from "lucide-react";

export interface OrganizerTaskDetailProps {
  task: OrganizerTask;
  course?: Course;
  isModalOpen?: boolean;
  onClose: () => void;
  onToggleStatus: () => void;
  onStatusChange: (status: OrganizerTask["status"]) => void;
  onEdit: () => void;
  onDelete: () => void;
}

const AVAILABLE_STATUSES: Array<OrganizerTask["status"]> = [
  "Pendiente",
  "En curso",
  "Completada",
];

export function OrganizerTaskDetail({
  task,
  course,
  isModalOpen = false,
  onClose,
  onToggleStatus,
  onStatusChange,
  onEdit,
  onDelete,
}: OrganizerTaskDetailProps) {
  // Cierre accesible con tecla Escape si no hay un modal superpuesto
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isModalOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isModalOpen]);

  const isDone = task.status === "Completada";
  const dueDate = parseLocalDate(task.endDate);
  const formattedDate = !isNaN(dueDate.getTime())
    ? dueDate.toLocaleDateString("es-CL", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : task.endDate;

  return (
    <>
      {/* Backdrop oscuro con desenfoque para pantallas móviles y tablets */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Tarjeta flotante/embebida */}
      <aside
        className="fixed inset-y-2 right-2 left-2 sm:left-auto sm:right-3 sm:w-[350px] z-50 lg:static lg:z-auto lg:w-[340px] xl:w-[360px] lg:shrink-0 lg:my-2.5 lg:mr-3 lg:h-[calc(100%-1.25rem)] rounded-2xl bg-surface border border-border shadow-2xl lg:shadow-xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-250 ease-out"
        role="region"
        aria-label="Detalle de actividad"
      >
        {/* Header / Barra superior sutil */}
        <div className="px-4 py-2.5 flex items-center justify-between gap-3 border-b border-border/50 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-text-muted px-2 py-0.5 rounded bg-panel border border-border/60">
              Detalle de actividad
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-text-dim hidden sm:inline-block">
              ESC
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar panel de detalle"
              title="Cerrar detalle (Esc)"
              className="text-text-muted hover:text-text p-1.5 rounded-lg hover:bg-panel transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-blue"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Contenido central scrolleable */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
          {/* Hero: Checkbox y Título */}
          <div className="flex items-start gap-2.5">
            <button
              type="button"
              onClick={onToggleStatus}
              aria-label={isDone ? "Marcar como pendiente" : "Marcar como completada"}
              title={isDone ? "Marcar como pendiente" : "Marcar como completada"}
              className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 transform active:scale-75 flex-shrink-0 cursor-pointer mt-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue ${
                isDone
                  ? "bg-accent-green border-accent-green text-white shadow-sm shadow-accent-green/30 scale-100"
                  : "border-border-bright hover:border-accent-blue hover:bg-accent-blue/10 text-transparent"
              }`}
            >
              <Check
                className={`w-3.5 h-3.5 stroke-[3] transition-all duration-200 ${
                  isDone ? "scale-100 opacity-100" : "scale-0 opacity-0"
                }`}
              />
            </button>
            <div className="min-w-0 flex-1">
              <h2
                className={`text-[15px] font-display font-bold leading-snug break-words transition-colors ${
                  isDone ? "line-through text-text-muted/80 opacity-75" : "text-text"
                }`}
              >
                {task.title}
              </h2>
            </div>
          </div>

          {/* Selector de estado segmentado tipo Linear / Notion */}
          <div>
            <div className="flex p-0.5 bg-panel/70 border border-border/70 rounded-lg gap-0.5">
              {AVAILABLE_STATUSES.map((st) => {
                const isCurrent = task.status === st;
                const meta = STATUS_META[st];
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => onStatusChange(st)}
                    className={`flex-1 py-1 px-1.5 rounded-lg text-[10.5px] font-medium flex items-center justify-center gap-1 transition-all duration-150 cursor-pointer ${
                      isCurrent
                        ? "bg-surface text-text shadow-xs border border-border/50 font-semibold"
                        : "text-text-muted hover:text-text hover:bg-surface/50"
                    }`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-transform"
                      style={{ backgroundColor: meta.dot }}
                    />
                    <span className="truncate">{st}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Panel de Propiedades y Metadatos ordenado */}
          <div className="rounded-xl border border-border/60 bg-panel/30 p-2.5 space-y-2 text-[10.5px]">
            {/* Ramo */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-text-muted">
                {course ? (
                  <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
                ) : (
                  <User className="w-3.5 h-3.5 flex-shrink-0" />
                )}
                <span className="font-mono uppercase tracking-wider text-[10px]">
                  Ramo
                </span>
              </div>
              {course ? (
                <div
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-medium max-w-[210px] truncate"
                  style={{
                    backgroundColor: `${course.color}15`,
                    color: course.color,
                    border: `1px solid ${course.color}35`,
                  }}
                  title={`${course.code} - ${course.name}`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: course.color }}
                  />
                  <span className="truncate">{course.name}</span>
                </div>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface border border-border font-mono text-text-muted">
                  Personal
                </span>
              )}
            </div>

            {/* Código */}
            {course && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-text-muted">
                  <Hash className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="font-mono uppercase tracking-wider text-[10px]">
                    Código
                  </span>
                </div>
                <span
                  className="inline-block px-2 py-0.5 rounded-md font-mono font-semibold"
                  style={{
                    backgroundColor: `${course.color}15`,
                    color: course.color,
                    border: `1px solid ${course.color}35`,
                  }}
                >
                  {course.code}
                </span>
              </div>
            )}

            {/* Tipo */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-text-muted">
                <Tag className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="font-mono uppercase tracking-wider text-[10px]">
                  Tipo
                </span>
              </div>
              <span
                className="inline-block px-2 py-0.5 rounded-md font-mono font-medium"
                style={{
                  backgroundColor: `${CATEGORY_COLORS[task.type]}15`,
                  color: CATEGORY_COLORS[task.type],
                  border: `1px solid ${CATEGORY_COLORS[task.type]}35`,
                }}
              >
                {task.type}
              </span>
            </div>

            {/* Prioridad */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-text-muted">
                <Flag className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="font-mono uppercase tracking-wider text-[10px]">
                  Prioridad
                </span>
              </div>
              <span
                className="inline-block px-2 py-0.5 rounded-md font-mono font-medium"
                style={{
                  backgroundColor: PRIORITY_META[task.priority].bg,
                  color: PRIORITY_META[task.priority].color,
                  border: `1px solid ${PRIORITY_META[task.priority].color}35`,
                }}
              >
                {task.priority}
              </span>
            </div>

            {/* Entrega con CountdownBadge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-text-muted">
                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="font-mono uppercase tracking-wider text-[10px]">
                  Entrega
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-text font-medium">
                  {formattedDate}
                  {task.dueTime && (
                    <span className="text-text-muted"> • {task.dueTime}</span>
                  )}
                </span>
                <CountdownBadge dateStr={task.endDate} isDone={isDone} compact />
              </div>
            </div>
          </div>

          {/* Sección de notas y descripción */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold text-text-muted uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5" />
              <span>Notas y descripción</span>
            </div>
            {task.notes && task.notes.trim() ? (
              <div className="p-2.5 bg-panel/30 border border-border/60 rounded-xl text-[12px] text-text whitespace-pre-wrap leading-relaxed font-body min-h-[60px]">
                {task.notes}
              </div>
            ) : (
              <div className="p-2.5 bg-panel/20 border border-dashed border-border/80 rounded-xl text-[11px] text-text-muted italic font-mono flex items-center justify-center text-center min-h-[60px]">
                Sin notas adicionales para esta actividad.
              </div>
            )}
          </div>
        </div>

        {/* Footer de acciones */}
        <div className="px-4 py-2.5 border-t border-border/50 bg-surface flex items-center justify-between gap-2.5 flex-shrink-0">
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 py-1.5 px-3 text-[11px] font-semibold text-accent-red hover:bg-accent-red/10 border border-accent-red/20 rounded-lg transition-all duration-150 cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-red"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar</span>
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 py-1.5 px-3 text-[11px] font-semibold bg-accent-blue hover:bg-accent-blue/90 text-white rounded-lg transition-all duration-150 shadow-md shadow-accent-blue/20 hover:shadow-accent-blue/35 cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Editar</span>
          </button>
        </div>
      </aside>
    </>
  );
}
