import { useState } from "react";
import type { Project } from "../../../types/projects";
import { COLORS } from "../../../data/mockScrum";

export function NewProjectModal({
  onCreate,
  onClose,
}: {
  onCreate: (p: Omit<Project, "id" | "tasks" | "sprints" | "categories" | "members">) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [course, setCourse] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  return (
    <div className="fixed inset-0 bg-[#0d0f14]/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#151820] border border-[#2a2f45] rounded-xl p-6 w-[400px] shadow-2xl">
        <h2 className="text-lg font-bold text-white mb-6">Nuevo Proyecto</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-[#7c82a0] mb-1.5 uppercase">Nombre</label>
            <input autoFocus value={name} onChange={e => setName(e.target.value)} className="w-full bg-[#0d0f14] border border-[#2a2f45] rounded-md px-3 py-2 text-sm text-[#e8eaf2] focus:outline-none focus:border-[#4f7cff] transition-colors" placeholder="Ej: Sistema de Biblioteca" />
          </div>
          <div>
            <label className="block text-xs font-mono text-[#7c82a0] mb-1.5 uppercase">Ramo (Opcional)</label>
            <input value={course} onChange={e => setCourse(e.target.value)} className="w-full bg-[#0d0f14] border border-[#2a2f45] rounded-md px-3 py-2 text-sm text-[#e8eaf2] focus:outline-none focus:border-[#4f7cff] transition-colors" placeholder="Ej: IIC2143" />
          </div>
          <div>
            <label className="block text-xs font-mono text-[#7c82a0] mb-2 uppercase">Color</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)} className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${color === c ? "ring-2 ring-white ring-offset-2 ring-offset-[#151820]" : ""}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-md text-sm font-medium text-[#7c82a0] hover:bg-[#2a2f45] hover:text-[#e8eaf2] transition-colors">Cancelar</button>
          <button onClick={() => { if (!name.trim()) return; onCreate({ name, course, color, description: "" }); }} className="flex-1 px-4 py-2 bg-[#4f7cff] text-white rounded-md text-sm font-medium hover:bg-[#3d6ae0] transition-colors">Crear Proyecto</button>
        </div>
      </div>
    </div>
  );
}
