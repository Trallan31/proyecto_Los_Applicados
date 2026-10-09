
import React, { useState } from 'react';
import type { OrganizerTask, TaskType, Course } from "../../../types";
import { TASK_TYPES } from "../../../constants/ui";

export function AddOrganizerTaskModal({
  courses,
  defaultCourseId,
  onClose,
  onAdd,
}: {
  courses: Course[];
  defaultCourseId: string | null;
  onClose: () => void;
  onAdd: (t: Omit<OrganizerTask, "id" | "userId">) => void;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<TaskType>("Tarea");
  const [courseId, setCourseId] = useState<string | null>(defaultCourseId ?? null);
  const [priority, setPriority] = useState<"Alta" | "Media" | "Baja">("Media");
  const [endDate, setEndDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [notes, setNotes] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !endDate) return;
    const finalCourseId = courseId || null;
    onAdd({
      title: title.trim(),
      type,
      status: "Pendiente",
      endDate,
      dueTime: dueTime || undefined,
      courseId: finalCourseId,
      notes: notes.trim() || undefined,
      priority,
      scope: finalCourseId === null ? "Personal" : "Ramo",
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-panel border border-border rounded-xl w-full max-w-md mx-4 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-surface">
          <h2 className="font-display font-bold text-[14px] text-text">Nueva Actividad Individual</h2>
          <button onClick={onClose} className="text-text-dim hover:text-text-muted text-lg leading-none">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <Field label="Título">
            <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="¿Qué debes hacer?" className="w-full bg-background border border-border rounded-md px-3 py-2 text-[13px] text-text placeholder-text-dim focus:outline-none focus:border-[#4f7cff]" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ramo">
              <select value={courseId ?? ""} onChange={(e) => setCourseId(e.target.value || null)} className="w-full bg-background border border-border rounded-md px-3 py-2 text-[12px] text-text focus:outline-none focus:border-[#4f7cff]">
                <option value="">Sin ramo (Personal)</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
              </select>
            </Field>
            <Field label="Tipo">
              <select value={type} onChange={(e) => setType(e.target.value as TaskType)} className="w-full bg-background border border-border rounded-md px-3 py-2 text-[12px] text-text focus:outline-none focus:border-[#4f7cff]">
                {TASK_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Prioridad">
              <select value={priority} onChange={(e) => setPriority(e.target.value as "Alta" | "Media" | "Baja")} className="w-full bg-background border border-border rounded-md px-3 py-2 text-[12px] text-text focus:outline-none focus:border-[#4f7cff]">
                <option value="Alta">Alta</option>
                <option value="Media">Media</option>
                <option value="Baja">Baja</option>
              </select>
            </Field>
            <Field label="Fecha límite">
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="w-full bg-background border border-border rounded-md px-3 py-2 text-[12px] text-text focus:outline-none focus:border-[#4f7cff]" />
            </Field>
          </div>
          <Field label="Hora de entrega (opcional - si no se indica aparece a primera hora)">
            <input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} className="w-full bg-background border border-border rounded-md px-3 py-2 text-[12px] text-text focus:outline-none focus:border-[#4f7cff]" />
          </Field>
          <Field label="Notas (opcional)">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Detalles adicionales" rows={2} className="w-full bg-background border border-border rounded-md px-3 py-2 text-[12px] text-text placeholder-text-dim focus:outline-none focus:border-[#4f7cff] resize-none" />
          </Field>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-1.5 text-[12px] font-semibold text-text-dim hover:text-text-muted">Cancelar</button>
            <button type="submit" disabled={!title.trim() || !endDate} className="px-4 py-1.5 text-[12px] font-semibold bg-[#4f7cff] hover:bg-[#3d6ae0] text-white rounded-md disabled:opacity-40">
              Crear actividad
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-mono text-text-dim mb-1">{label.toUpperCase()}</label>
      {children}
    </div>
  );
}
