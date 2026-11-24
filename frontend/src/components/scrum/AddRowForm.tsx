import { useState } from "react";
import type { Activity, Priority, Status, Member, Sprint } from "../../types";
import { PRIORITIES, STATUSES } from "../../constants/ui";
import { formatLocalDate, getToday, parseLocalDate } from "../../utils/dateUtils";

export function AddRowForm({
  sprints: projectSprints,
  members: teamMembers,
  categories,
  onAdd,
  onCreateCategory,
  onCreateSprint,
  onCancel,
}: {
  sprints: Sprint[];
  members: Member[];
  categories: string[];
  onAdd: (t: Omit<Activity, "id" | "projectId">) => Promise<Activity | null>;
  onCreateCategory?: (name: string) => Promise<boolean> | boolean;
  onCreateSprint?: (name: string) => Promise<Sprint | null>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sprintId, setSprintId] = useState<string>(projectSprints[0]?.id ?? "");
  const [category, setCategory] = useState(categories[0] ?? "");
  const [members, setMembers] = useState<string[]>([]);
  const [priority, setPriority] = useState<Priority>("Media");
  const [status, setStatus] = useState<Status>("Pendiente");
  const [hours, setHours] = useState(0);
  const [dueDate, setDueDate] = useState(() => formatLocalDate(getToday()));
  const [validationError, setValidationError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canCreateCategory = Boolean(onCreateCategory);
  const canCreateSprint = Boolean(onCreateSprint);
  const [isCreatingCategory, setIsCreatingCategory] = useState(
    canCreateCategory && categories.length === 0
  );
  const [newCatName, setNewCatName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [isCreatingSprint, setIsCreatingSprint] = useState(
    canCreateSprint && projectSprints.length === 0
  );
  const [newSprintName, setNewSprintName] = useState("");
  const [creatingSprint, setCreatingSprint] = useState(false);

  async function handleSubmit() {
    if (submitting || creatingCategory || creatingSprint) return;
    setValidationError("");

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setValidationError("Ingresa un nombre para la tarea.");
      return;
    }

    const parsedDue = parseLocalDate(dueDate);
    if (!dueDate || Number.isNaN(parsedDue.getTime())) {
      setValidationError("Selecciona una fecha límite válida.");
      return;
    }

    const safeHours = Number.isFinite(hours)
      ? Math.min(10000, Math.max(0, hours))
      : 0;

    setSubmitting(true);
    try {
      let finalCat = category || categories[0] || "";
      if (
        canCreateCategory &&
        (isCreatingCategory || categories.length === 0) &&
        newCatName.trim() &&
        onCreateCategory
      ) {
        const trimmedCat = newCatName.trim();
        // Espera a que la categoría quede persistida antes de crear la actividad.
        const ok = await onCreateCategory(trimmedCat);
        if (!ok) {
          setValidationError("No se pudo crear la categoría. Intenta nuevamente.");
          return;
        }
        finalCat = trimmedCat;
        setCategory(finalCat);
        setNewCatName("");
        setIsCreatingCategory(false);
      }

      let finalSprintId = sprintId;
      if (
        canCreateSprint &&
        (isCreatingSprint || projectSprints.length === 0) &&
        newSprintName.trim() &&
        onCreateSprint
      ) {
        const createdSprint = await onCreateSprint(newSprintName.trim());
        if (!createdSprint) {
          setValidationError("No se pudo crear el sprint. Intenta nuevamente.");
          return;
        }
        finalSprintId = createdSprint.id;
        setSprintId(finalSprintId);
        setNewSprintName("");
        setIsCreatingSprint(false);
      }

      const createdTask = await onAdd({
        title: trimmedTitle,
        description: description.trim(),
        sprintId: finalSprintId,
        category: finalCat,
        members,
        priority,
        status,
        hours: safeHours,
        dueDate,
      });
      if (!createdTask) {
        setValidationError("No se pudo guardar la tarea. Intenta nuevamente.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateCategorySubmit() {
    if (!onCreateCategory || creatingCategory || submitting) return;
    const trimmed = newCatName.trim();
    if (!trimmed) return;

    setValidationError("");
    setCreatingCategory(true);
    try {
      const ok = await onCreateCategory(trimmed);
      if (!ok) {
        setValidationError("No se pudo crear la categoría. Intenta nuevamente.");
        return;
      }
      setCategory(trimmed);
      setNewCatName("");
      setIsCreatingCategory(false);
    } finally {
      setCreatingCategory(false);
    }
  }

  async function handleCreateSprintSubmit() {
    if (creatingSprint || submitting || !newSprintName.trim() || !onCreateSprint) return;
    setValidationError("");
    setCreatingSprint(true);
    try {
      const created = await onCreateSprint(newSprintName.trim());
      if (!created) {
        setValidationError("No se pudo crear el sprint. Intenta nuevamente.");
        return;
      }
      setSprintId(created.id);
      setNewSprintName("");
      setIsCreatingSprint(false);
    } finally {
      setCreatingSprint(false);
    }
  }

  return (
    <>
      <tr className="border-b border-accent-blue/30 bg-accent-blue/5">
        {/* Columna del tirador de reordenar: la fila nueva no se arrastra. */}
        <td className="border-r border-border h-9" />

        {/* 1. TAREA (title) */}
        <td className="px-1 py-0 border-r border-border h-9">
          <input
            autoFocus
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (validationError) setValidationError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleSubmit();
              }
              if (e.key === "Escape") onCancel();
            }}
            placeholder="Nombre de la tarea..."
            aria-label="Nombre de la tarea"
            className="w-full bg-transparent px-2 py-1 text-[12px] font-medium text-text placeholder-text-muted focus:outline-none"
          />
        </td>

        {/* 2. SPRINT */}
        <td className="px-1 py-0 border-r border-border h-9">
          {canCreateSprint && (isCreatingSprint || projectSprints.length === 0) ? (
            <div className="flex items-center gap-1">
              <input
                autoFocus={isCreatingSprint}
                disabled={creatingSprint || submitting}
                value={newSprintName}
                onChange={(e) => {
                  setNewSprintName(e.target.value);
                  if (validationError) setValidationError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleCreateSprintSubmit();
                  }
                  if (e.key === "Escape" && !creatingSprint) setIsCreatingSprint(false);
                }}
                placeholder="Nombre Sprint..."
                aria-label="Nombre del nuevo sprint"
                className="w-full bg-transparent text-[11px] font-mono text-text placeholder-text-muted focus:outline-none disabled:opacity-50"
              />
              {projectSprints.length > 0 && (
                <button
                  type="button"
                  disabled={creatingSprint || submitting}
                  onClick={() => setIsCreatingSprint(false)}
                  className="text-[10px] text-text-muted disabled:opacity-40"
                  aria-label="Cancelar nuevo sprint"
                >
                  ✕
                </button>
              )}
            </div>
          ) : (
            <select
              value={sprintId}
              onChange={(e) => {
                if (e.target.value === "__NEW__" && canCreateSprint) {
                  setIsCreatingSprint(true);
                } else {
                  setSprintId(e.target.value);
                }
              }}
              aria-label="Sprint"
              className="w-full bg-transparent text-[11px] font-mono text-text focus:outline-none"
            >
              {projectSprints.length === 0 && (
                <option value="" className="bg-surface text-text-muted">
                  Sin sprint
                </option>
              )}
              {projectSprints.map((s) => (
                <option key={s.id} value={s.id} className="bg-surface text-text">
                  {s.name}
                </option>
              ))}
              {canCreateSprint && (
                <option value="__NEW__" className="bg-surface text-accent-blue font-bold">
                  + Nuevo Sprint...
                </option>
              )}
            </select>
          )}
        </td>

        {/* 3. CATEGORIA */}
        <td className="px-1 py-0 border-r border-border h-9">
          {canCreateCategory && (isCreatingCategory || categories.length === 0) ? (
            <div className="flex items-center gap-1">
              <input
                autoFocus={isCreatingCategory}
                disabled={creatingCategory || submitting}
                value={newCatName}
                onChange={(e) => {
                  setNewCatName(e.target.value);
                  if (validationError) setValidationError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleCreateCategorySubmit();
                  }
                  if (e.key === "Escape" && !creatingCategory) setIsCreatingCategory(false);
                }}
                placeholder="Categoría..."
                aria-label="Nombre de la nueva categoría"
                className="w-full bg-transparent text-[11px] font-mono text-text placeholder-text-muted focus:outline-none disabled:opacity-50"
              />
              {categories.length > 0 && (
                <button
                  type="button"
                  disabled={creatingCategory || submitting}
                  onClick={() => setIsCreatingCategory(false)}
                  className="text-[10px] text-text-muted disabled:opacity-40"
                  aria-label="Cancelar nueva categoría"
                >
                  ✕
                </button>
              )}
            </div>
          ) : (
            <select
              value={categories.includes(category) ? category : (categories[0] ?? "")}
              onChange={(e) => {
                if (e.target.value === "__NEW__" && canCreateCategory) {
                  setIsCreatingCategory(true);
                } else {
                  setCategory(e.target.value);
                }
              }}
              aria-label="Categoría"
              className="w-full bg-transparent text-[11px] font-mono text-text focus:outline-none"
            >
              {categories.length === 0 && (
                <option value="" className="bg-surface text-text-muted">
                  Sin categoría
                </option>
              )}
              {categories.map((c) => (
                <option key={c} value={c} className="bg-surface text-text">
                  {c}
                </option>
              ))}
              {canCreateCategory && (
                <option value="__NEW__" className="bg-surface text-accent-blue font-bold">
                  + Nueva categoría...
                </option>
              )}
            </select>
          )}
        </td>

        {/* 4. RESPONSABLE (members) */}
        <td className="px-2 py-0 border-r border-border h-9">
          <div className="flex flex-wrap gap-1">
            {teamMembers.map((m) => {
              const selected = members.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() =>
                    setMembers((prev) =>
                      prev.includes(m.id) ? prev.filter((id) => id !== m.id) : [...prev, m.id]
                    )
                  }
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold transition-all cursor-pointer ${
                    selected
                      ? "text-white"
                      : "bg-panel text-text border border-border opacity-75 hover:opacity-100"
                  }`}
                  style={selected ? { backgroundColor: m.avatarColor } : undefined}
                  title={m.name}
                  aria-label={`Asignar a ${m.name}`}
                  aria-pressed={selected}
                >
                  {m.initials}
                </button>
              );
            })}
          </div>
        </td>

        {/* 5. PRIORIDAD */}
        <td className="px-1 py-0 border-r border-border h-9">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            aria-label="Prioridad"
            className="w-full bg-transparent text-[11px] font-mono text-text focus:outline-none"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p} className="bg-surface text-text">
                {p}
              </option>
            ))}
          </select>
        </td>

        {/* 6. ESTADO */}
        <td className="px-1 py-0 border-r border-border h-9">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
            aria-label="Estado"
            className="w-full bg-transparent text-[11px] font-mono text-text focus:outline-none"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s} className="bg-surface text-text">
                {s}
              </option>
            ))}
          </select>
        </td>

        {/* 7. HORAS */}
        <td className="px-1 py-0 border-r border-border h-9">
          <input
            type="number"
            min={0}
            max={10000}
            value={hours || ""}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === "") {
                setHours(0);
                return;
              }
              const parsed = Number(raw);
              if (!Number.isFinite(parsed)) {
                setHours(0);
                return;
              }
              setHours(Math.min(10000, Math.max(0, parsed)));
            }}
            placeholder="h"
            aria-label="Horas estimadas"
            className="w-full bg-transparent px-2 text-[11px] font-mono text-text placeholder-text-muted focus:outline-none dark:[color-scheme:dark]"
          />
        </td>

        {/* 8. DEADLINE (dueDate) */}
        <td className="px-1 py-0 border-r border-border h-9 cursor-pointer">
          <input
            type="date"
            value={dueDate}
            onChange={(e) => {
              setDueDate(e.target.value);
              if (validationError) setValidationError("");
            }}
            aria-label="Fecha límite"
            className="w-full bg-transparent text-[11px] font-mono text-text focus:outline-none cursor-pointer text-right dark:[color-scheme:dark]"
          />
        </td>

        {/* 9. NOTAS (description) Y ACCIONES */}
        <td className="px-3 py-0 h-9">
          <div className="flex items-center justify-between gap-2">
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleSubmit();
                }
                if (e.key === "Escape") onCancel();
              }}
              placeholder="Notas..."
              aria-label="Notas de la tarea"
              className="w-full bg-transparent text-[11px] text-text placeholder-text-muted focus:outline-none min-w-0"
            />
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={submitting}
                className="text-[11px] font-mono text-accent-blue hover:text-accent-green font-bold px-1 transition-colors cursor-pointer disabled:opacity-50"
                title="Guardar tarea (Enter)"
                aria-label="Guardar tarea"
              >
                ✓
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={submitting}
                className="text-[11px] font-mono text-text-muted hover:text-accent-red font-bold px-1 transition-colors cursor-pointer disabled:opacity-50"
                title="Cancelar (Esc)"
                aria-label="Cancelar"
              >
                ✕
              </button>
            </div>
          </div>
        </td>
      </tr>
      {validationError && (
        <tr className="border-b border-accent-red/30 bg-accent-red/10">
          <td colSpan={10} className="px-3 py-1.5">
            <p role="alert" className="text-[11px] font-mono text-accent-red">
              {validationError}
            </p>
          </td>
        </tr>
      )}
    </>
  );
}
