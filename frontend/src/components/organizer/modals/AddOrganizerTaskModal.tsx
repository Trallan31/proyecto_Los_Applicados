import React, { useState } from 'react';
import type { OrganizerTask, TaskType, TaskScope, Course } from "../../../types";
import { TASK_TYPES } from "../../../constants/ui";
import { Modal } from "../../shared/Modal";

type BaseModalProps = {
  courses: Course[];
  defaultCourseId?: string | null;
  onClose: () => void;
};

type CreateModalProps = BaseModalProps & {
  initialTask?: undefined;
  onAdd: (t: Omit<OrganizerTask, "id" | "userId">) => Promise<boolean> | boolean;
  onEdit?: undefined;
};

type EditModalProps = BaseModalProps & {
  initialTask: OrganizerTask;
  onEdit: (id: string, changes: Partial<Omit<OrganizerTask, "id" | "userId">>) => Promise<boolean> | boolean;
  onAdd?: undefined;
};

export type OrganizerTaskModalProps = CreateModalProps | EditModalProps;

export function AddOrganizerTaskModal(props: OrganizerTaskModalProps) {
  const { courses, defaultCourseId, onClose, initialTask } = props;
  const isEditing = Boolean(initialTask);
  const [title, setTitle] = useState(initialTask ? initialTask.title : "");
  const [type, setType] = useState<TaskType>(initialTask ? initialTask.type : "Tarea");
  const [courseId, setCourseId] = useState<string | null>(
    initialTask ? initialTask.courseId : (defaultCourseId ?? null)
  );
  const [priority, setPriority] = useState<"Alta" | "Media" | "Baja">(
    initialTask ? initialTask.priority : "Media"
  );
  const [status, setStatus] = useState<OrganizerTask["status"]>(
    initialTask ? initialTask.status : "Pendiente"
  );
  const [endDate, setEndDate] = useState(initialTask ? initialTask.endDate : "");
  const [dueTime, setDueTime] = useState(initialTask ? (initialTask.dueTime ?? "") : "");
  const [notes, setNotes] = useState(initialTask ? (initialTask.notes ?? "") : "");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || !title.trim() || !endDate) return;
    const finalCourseId = courseId || null;
    const payload = {
      title: title.trim(),
      type,
      status: isEditing ? status : ("Pendiente" as const),
      endDate,
      dueTime: dueTime || null,
      courseId: finalCourseId,
      notes: notes.trim() || null,
      priority,
      scope: (finalCourseId === null ? "Personal" : "Ramo") as TaskScope,
    };

    // Solo cierra el modal si la mutación tuvo éxito; si falla, conserva el formulario.
    setSubmitting(true);
    try {
      const ok = props.initialTask
        ? await props.onEdit(props.initialTask.id, payload)
        : await props.onAdd(payload);
      if (ok) {
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={() => {
        if (!submitting) onClose();
      }}
      titleId="modal-task-title"
      maxWidthClass="max-w-md"
      closeOnBackdropClick={!submitting}
      closeOnEscape={!submitting}
      className="bg-panel overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-surface">
        <h2 id="modal-task-title" className="font-display font-bold text-[14px] text-text">
          {isEditing ? "Editar Actividad" : "Nueva Actividad Individual"}
        </h2>
        <button
          type="button"
          disabled={submitting}
          onClick={() => {
            if (!submitting) onClose();
          }}
          aria-label="Cerrar modal"
          title="Cerrar modal"
          className="text-text-muted hover:text-text text-lg leading-none cursor-pointer rounded p-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-blue disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ✕
        </button>
      </div>
      <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
        <Field label="Título" htmlFor="task-title">
          <input id="task-title" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="¿Qué debes hacer?" className="w-full bg-background border border-border rounded-md px-3 py-2 text-[13px] text-text placeholder-text-muted focus:outline-none focus:border-accent-blue" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ramo" htmlFor="task-course">
            <select id="task-course" value={courseId ?? ""} onChange={(e) => setCourseId(e.target.value || null)} className="w-full bg-background border border-border rounded-md px-3 py-2 text-[12px] text-text focus:outline-none focus:border-accent-blue cursor-pointer">
              <option value="">Sin ramo (Personal)</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
            </select>
          </Field>
          <Field label="Tipo" htmlFor="task-type">
            <select id="task-type" value={type} onChange={(e) => setType(e.target.value as TaskType)} className="w-full bg-background border border-border rounded-md px-3 py-2 text-[12px] text-text focus:outline-none focus:border-accent-blue cursor-pointer">
              {TASK_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Prioridad" htmlFor="task-priority">
            <select id="task-priority" value={priority} onChange={(e) => setPriority(e.target.value as "Alta" | "Media" | "Baja")} className="w-full bg-background border border-border rounded-md px-3 py-2 text-[12px] text-text focus:outline-none focus:border-accent-blue cursor-pointer">
              <option value="Alta">Alta</option>
              <option value="Media">Media</option>
              <option value="Baja">Baja</option>
            </select>
          </Field>
          {isEditing ? (
            <Field label="Estado" htmlFor="task-status">
              <select id="task-status" value={status} onChange={(e) => setStatus(e.target.value as OrganizerTask["status"])} className="w-full bg-background border border-border rounded-md px-3 py-2 text-[12px] text-text focus:outline-none focus:border-accent-blue cursor-pointer">
                <option value="Pendiente">Pendiente</option>
                <option value="En curso">En curso</option>
                <option value="Completada">Completada</option>
              </select>
            </Field>
          ) : null}
          <div className={!isEditing ? "" : "col-span-2"}>
            <Field label="Fecha límite" htmlFor="task-enddate">
              <input id="task-enddate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="w-full bg-background border border-border rounded-md px-3 py-2 text-[12px] text-text focus:outline-none focus:border-accent-blue cursor-pointer" />
            </Field>
          </div>
        </div>
        <Field label="Hora de entrega (opcional - si no se indica aparece a primera hora)" htmlFor="task-duetime">
          <input id="task-duetime" type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} className="w-full bg-background border border-border rounded-md px-3 py-2 text-[12px] text-text focus:outline-none focus:border-accent-blue cursor-pointer" />
        </Field>
        <Field label="Notas (opcional)" htmlFor="task-notes">
          <textarea id="task-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Detalles adicionales" rows={2} className="w-full bg-background border border-border rounded-md px-3 py-2 text-[12px] text-text placeholder-text-muted focus:outline-none focus:border-accent-blue resize-none" />
        </Field>
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            disabled={submitting}
            onClick={() => {
              if (!submitting) onClose();
            }}
            className="px-4 py-1.5 text-[12px] font-semibold text-text-muted hover:text-text transition-colors cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting || !title.trim() || !endDate}
            className="px-4 py-1.5 text-[12px] font-semibold bg-accent-blue hover:opacity-90 text-white rounded-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
          >
            {submitting ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear actividad"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-[10px] font-mono text-text-muted font-semibold mb-1 cursor-pointer">
        {label.toUpperCase()}
      </label>
      {children}
    </div>
  );
}
