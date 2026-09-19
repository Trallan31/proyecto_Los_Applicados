import { useState } from "react";
import type { Activity, Priority, Status } from "../../types/activities";
import type { Project } from "../../types/projects";
import type { Sprint } from "../../types/sprints";

export function AddRowForm({
  project,
  ALL_SPRINTS,
  PRIORITIES,
  STATUSES,
  onAdd,
  onCreateCategory,
  onCreateSprint,
  onCancel,
}: {
  project: Project;
  ALL_SPRINTS: Sprint[];
  PRIORITIES: Priority[];
  STATUSES: Status[];
  onAdd: (t: Omit<Activity, "id" | "project">) => void;
  onCreateCategory?: (name: string) => void;
  onCreateSprint?: (name: string) => Sprint;
  onCancel: () => void;
}) {
  const projectSprints = ALL_SPRINTS.filter(s => s.projectId === project.id);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sprintId, setSprintId] = useState<string>(projectSprints[0]?.id ?? "sprint-1");
  const [category, setCategory] = useState(project.categories[0] ?? "");
  const [members, setMembers] = useState<string[]>([]);
  const [priority, setPriority] = useState<Priority>("Media");
  const [status, setStatus] = useState<Status>("Pendiente");
  const [hours, setHours] = useState(0);
  const [dueDate, setDueDate] = useState("");

  const [isCreatingCategory, setIsCreatingCategory] = useState(project.categories.length === 0);
  const [newCatName, setNewCatName] = useState("");
  const [isCreatingSprint, setIsCreatingSprint] = useState(projectSprints.length === 0);
  const [newSprintName, setNewSprintName] = useState("");

  function handleSubmit() {
    if (!title.trim()) { onCancel(); return; }
    
    let finalCat = category || project.categories[0] || "";
    if (isCreatingCategory && newCatName.trim() && onCreateCategory) {
      finalCat = newCatName.trim();
      onCreateCategory(finalCat);
      setCategory(finalCat);
      setNewCatName("");
      setIsCreatingCategory(false);
    }

    let finalSprintId = sprintId;
    if (isCreatingSprint && newSprintName.trim() && onCreateSprint) {
      const newS = onCreateSprint(newSprintName.trim());
      finalSprintId = newS.id;
      setSprintId(finalSprintId);
      setNewSprintName("");
      setIsCreatingSprint(false);
    }

    onAdd({ title, description, sprintId: finalSprintId, category: finalCat, members, priority, status, hours, dueDate });
  }

  function handleCreateCategorySubmit() {
    if (newCatName.trim() && onCreateCategory) {
      const trimmed = newCatName.trim();
      onCreateCategory(trimmed);
      setCategory(trimmed);
      setNewCatName("");
      setIsCreatingCategory(false);
    }
  }

  function handleCreateSprintSubmit() {
    if (newSprintName.trim() && onCreateSprint) {
      const trimmed = newSprintName.trim();
      const newS = onCreateSprint(trimmed);
      setSprintId(newS.id);
      setNewSprintName("");
      setIsCreatingSprint(false);
    }
  }

  return (
    <tr className="border-b border-[#4f7cff]/30 bg-[#4f7cff]/5">

      {/* 2. TAREA (title) */}
      <td className="px-1 py-0 border-r border-[#2a2f45] h-9">
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); if (e.key === "Escape") onCancel(); }}
          placeholder="Nombre de la tarea..."
          className="w-full bg-transparent px-2 py-1 text-[12px] font-medium text-[#e8eaf2] placeholder-[#2a2f45] focus:outline-none"
        />
      </td>

      {/* 3. SPRINT */}
      <td className="px-1 py-0 border-r border-[#2a2f45] h-9">
        {isCreatingSprint || projectSprints.length === 0 ? (
          <div className="flex items-center gap-1">
            <input
              autoFocus={isCreatingSprint}
              value={newSprintName}
              onChange={(e) => setNewSprintName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreateSprintSubmit(); if (e.key === "Escape") setIsCreatingSprint(false); }}
              placeholder="Nombre Sprint..."
              className="w-full bg-transparent text-[11px] font-mono text-[#e8eaf2] focus:outline-none"
            />
            {projectSprints.length > 0 && (
              <button onClick={() => setIsCreatingSprint(false)} className="text-[10px] text-[#7c82a0]" aria-label="Cancelar">✕</button>
            )}
          </div>
        ) : (
          <select
            value={sprintId}
            onChange={(e) => {
              if (e.target.value === "__NEW__") {
                setIsCreatingSprint(true);
              } else {
                setSprintId(e.target.value);
              }
            }}
            className="w-full bg-transparent text-[11px] font-mono text-[#7c82a0] focus:outline-none"
          >
            {projectSprints.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            <option value="__NEW__" className="text-[#4f7cff] font-bold">+ Nuevo Sprint...</option>
          </select>
        )}
      </td>

      {/* CATEGORIA */}
      <td className="px-1 py-0 border-r border-[#2a2f45] h-9">
        {isCreatingCategory || project.categories.length === 0 ? (
          <div className="flex items-center gap-1">
            <input
              autoFocus={isCreatingCategory}
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreateCategorySubmit(); if (e.key === "Escape") setIsCreatingCategory(false); }}
              placeholder="Categoría..."
              className="w-full bg-transparent text-[11px] font-mono text-[#e8eaf2] focus:outline-none"
            />
            {project.categories.length > 0 && (
              <button onClick={() => setIsCreatingCategory(false)} className="text-[10px] text-[#7c82a0]" aria-label="Cancelar">✕</button>
            )}
          </div>
        ) : (
          <select
            value={project.categories.includes(category) ? category : (project.categories[0] ?? "")}
            onChange={(e) => {
              if (e.target.value === "__NEW__") {
                setIsCreatingCategory(true);
              } else {
                setCategory(e.target.value);
              }
            }}
            className="w-full bg-transparent text-[11px] font-mono text-[#7c82a0] focus:outline-none"
          >
            {project.categories.map((c) => <option key={c} value={c}>{c}</option>)}
            <option value="__NEW__" className="text-[#4f7cff] font-bold">+ Nueva categoría...</option>
          </select>
        )}
      </td>

      {/* 4. RESPONSABLE (members) */}
      <td className="px-2 py-0 border-r border-[#2a2f45] h-9">
        <div className="flex flex-wrap gap-1">
          {project.members.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMembers((prev) => prev.includes(m.id) ? prev.filter((id) => id !== m.id) : [...prev, m.id])}
              className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white transition-all"
              style={{ backgroundColor: members.includes(m.id) ? m.avatarColor : "#2a2f45", opacity: members.includes(m.id) ? 1 : 0.5 }}
              title={m.name}
              aria-label={`Asignar a ${m.name}`}
            >
              {m.initials}
            </button>
          ))}
        </div>
      </td>

      {/* 5. PRIORIDAD */}
      <td className="px-1 py-0 border-r border-[#2a2f45] h-9">
        <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="w-full bg-transparent text-[11px] font-mono text-[#7c82a0] focus:outline-none">
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </td>

      {/* 6. ESTADO */}
      <td className="px-1 py-0 border-r border-[#2a2f45] h-9">
        <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className="w-full bg-transparent text-[11px] font-mono text-[#7c82a0] focus:outline-none">
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </td>

      {/* HORAS */}
      <td className="px-1 py-0 border-r border-[#2a2f45] h-9">
        <input type="number" min="0" value={hours || ""} onChange={(e) => setHours(Number(e.target.value))} placeholder="h" className="w-full bg-transparent px-2 text-[11px] font-mono text-[#7c82a0] focus:outline-none" />
      </td>

      {/* 7. DEADLINE (dueDate) */}
      <td className="px-1 py-0 border-r border-[#2a2f45] h-9">
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full bg-transparent text-[11px] font-mono text-[#7c82a0] focus:outline-none" />
      </td>

      {/* 8. NOTAS (description) */}
      <td className="px-1 py-0 border-r border-[#2a2f45] h-9">
        <input value={description} onChange={(e) => setDescription(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); if (e.key === "Escape") onCancel(); }} placeholder="Notas..." className="w-full bg-transparent text-[11px] text-[#7c82a0] placeholder-[#2a2f45] focus:outline-none" />
      </td>

      {/* 9. Acciones */}
      <td className="h-9 px-2">
        <div className="flex items-center gap-1">
          <button onClick={handleSubmit} className="text-[10px] font-mono text-[#4f7cff] hover:text-[#3d6ae0] transition-colors" aria-label="Guardar tarea">✓</button>
          <button onClick={onCancel} className="text-[10px] font-mono text-[#4a5070] hover:text-[#7c82a0] transition-colors" aria-label="Cancelar">✕</button>
        </div>
      </td>
    </tr>
  );
}
