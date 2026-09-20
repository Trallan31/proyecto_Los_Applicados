import { useState } from 'react';
import type { Course, CourseSession, SessionType } from "../../../types";
import { PRESET_COLORS, FULL_DAYS, HOURS } from "../../../utils/dateUtils";
import { ConfirmModal } from "../../shared/ConfirmModal";

export function ManageCoursesModal({
  courses,
  sessions,
  onClose,
  onSave,
}: {
  courses: Course[];
  sessions: CourseSession[];
  onClose: () => void;
  onSave: (c: Course[], s: CourseSession[]) => void;
}) {
  const [localCourses, setLocalCourses] = useState<Course[]>(courses.map((c) => ({ ...c })));
  const [localSessions, setLocalSessions] = useState<CourseSession[]>(sessions.map((s) => ({ ...s })));
  const [activeCourseId, setActiveCourseId] = useState<string>(courses[0]?.id ?? "course-1");
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'course' | 'session'; id: string } | null>(null);

  // New Course Inputs
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);

  // New Session Inputs for Active Course
  const [sessType, setSessType] = useState<SessionType>("Cátedra");
  const [sessDay, setSessDay] = useState(0);
  const [sessHour, setSessHour] = useState(8);
  const [sessDuration, setSessDuration] = useState(2);

  function addCourse() {
    if (!newName.trim() || !newCode.trim()) return;
    const codeUpper = newCode.trim().toUpperCase();
    const initials = codeUpper.slice(0, 4);
    const newId = crypto.randomUUID();
    const newC: Course = {
      id: newId,
      userId: "user-1",
      name: newName.trim(),
      code: codeUpper,
      shortName: initials,
      color: newColor,
    };
    setLocalCourses((prev) => [...prev, newC]);
    setActiveCourseId(newId);
    setNewName("");
    setNewCode("");
  }

  function removeCourse(id: string) {
    setLocalCourses((prev) => prev.filter((c) => c.id !== id));
    setLocalSessions((prev) => prev.filter((s) => s.courseId !== id));
  }

  function addSession() {
    const newS: CourseSession = {
      id: crypto.randomUUID(),
      courseId: activeCourseId,
      dayOfWeek: sessDay,
      startHour: sessHour,
      duration: sessDuration,
      type: sessType,
    };
    setLocalSessions((prev) => [...prev, newS]);
  }

  function removeSession(id: string) {
    setLocalSessions((prev) => prev.filter((s) => s.id !== id));
  }

  const selectedCourse = localCourses.find((c) => c.id === activeCourseId);
  const courseSessions = localSessions.filter((s) => s.courseId === activeCourseId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#1c2030] border border-[#2a2f45] rounded-xl w-full max-w-2xl mx-4 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-[#2a2f45] flex items-center justify-between bg-[#151820]">
          <h2 className="font-display font-bold text-[15px] text-white">Gestionar Ramos y Horarios de Clases</h2>
          <button onClick={onClose} className="text-[#4a5070] hover:text-white text-lg">✕</button>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left Course List */}
          <div className="w-1/2 border-r border-[#2a2f45] flex flex-col p-4 bg-[#151820]">
            <h3 className="text-xs font-mono font-bold text-[#7c82a0] uppercase mb-3">Mis Ramos ({localCourses.length})</h3>
            <div className="flex-1 overflow-y-auto scrollbar-hide space-y-2 pr-1">
              {localCourses.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setActiveCourseId(c.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                    activeCourseId === c.id ? "bg-[#2a2f45] border-[#4f7cff]" : "bg-[#0d0f14] border-[#2a2f45] hover:border-[#3a4060]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                    <div className="truncate">
                      <p className="text-xs font-bold text-white truncate">{c.name}</p>
                      <p className="text-[10px] font-mono text-[#4f7cff] font-semibold">{c.code || c.shortName}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDelete({ type: 'course', id: c.id });
                    }}
                    className="text-[#4a5070] hover:text-[#ff5c6a] transition-colors text-xs font-bold p-1 ml-2"
                    title="Eliminar ramo"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Form to add new Course */}
            <div className="mt-4 pt-3 border-t border-[#2a2f45] space-y-2">
              <span className="text-[10px] font-mono text-[#4a5070] uppercase font-bold">Agregar nuevo ramo</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nombre ramo..."
                  className="bg-[#0d0f14] border border-[#2a2f45] rounded px-2.5 py-1 text-xs text-white placeholder-[#4a5070] focus:outline-none focus:border-[#4f7cff]"
                />
                <input
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="Código (ej: IIC2143)..."
                  className="bg-[#0d0f14] border border-[#2a2f45] rounded px-2.5 py-1 text-xs text-white placeholder-[#4a5070] focus:outline-none focus:border-[#4f7cff]"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {PRESET_COLORS.slice(0, 6).map((pc: string) => (
                    <button
                      key={pc}
                      onClick={() => setNewColor(pc)}
                      className="w-4 h-4 rounded-full transition-transform hover:scale-110"
                      style={{ backgroundColor: pc, outline: newColor === pc ? `2px solid ${pc}` : "none", outlineOffset: 1 }}
                    />
                  ))}
                </div>
                <button
                  onClick={addCourse}
                  disabled={!newName.trim() || !newCode.trim()}
                  className="px-3 py-1 bg-[#4f7cff] text-white rounded text-xs font-bold hover:bg-[#3d6ae0] disabled:opacity-40"
                >
                  + Ramo
                </button>
              </div>
            </div>
          </div>

          {/* Right Session Schedule Manager for Selected Course */}
          <div className="w-1/2 flex flex-col p-4 bg-[#1c2030] overflow-y-auto scrollbar-hide">
            {selectedCourse ? (
              <>
                <div className="flex items-center justify-between border-b border-[#2a2f45] pb-3 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedCourse.color }} />
                      {selectedCourse.name}
                    </h3>
                    <p className="text-[10px] font-mono text-[#4f7cff] font-semibold">{selectedCourse.code}</p>
                  </div>
                </div>

                <div className="space-y-3 flex-1">
                  <h4 className="text-xs font-mono font-bold text-[#7c82a0] uppercase">Horarios de Clases / Cátedras / Labs</h4>
                  
                  {/* List of sessions for this course */}
                  <div className="space-y-2">
                    {courseSessions.map((s) => (
                      <div key={s.id} className="flex items-center justify-between p-2.5 rounded bg-[#0d0f14] border border-[#2a2f45]">
                        <div>
                          <span className="text-xs font-semibold text-white">{FULL_DAYS[s.dayOfWeek]}</span>
                          <p className="text-[10px] font-mono text-[#7c82a0]">
                            {s.startHour}:00 - {s.startHour + s.duration}:00 ({s.type})
                          </p>
                        </div>
                        <button onClick={() => setConfirmDelete({ type: 'session', id: s.id })} className="text-[#4a5070] hover:text-[#ff5c6a] text-xs font-bold">
                          ✕
                        </button>
                      </div>
                    ))}
                    {courseSessions.length === 0 && (
                      <p className="text-xs text-[#4a5070] font-mono italic">Sin horarios registrados para este ramo.</p>
                    )}
                  </div>

                  {/* Add Session Form */}
                  <div className="mt-4 pt-3 border-t border-[#2a2f45] space-y-3">
                    <h5 className="text-[10px] font-mono font-bold text-[#4f7cff] uppercase">+ Añadir Horario de Clase</h5>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-mono text-[#4a5070] mb-1">TIPO</label>
                        <select value={sessType} onChange={(e) => setSessType(e.target.value as SessionType)} className="w-full bg-[#0d0f14] border border-[#2a2f45] rounded px-2 py-1 text-xs text-white">
                          <option value="Cátedra">Cátedra</option>
                          <option value="Auxiliar">Auxiliar</option>
                          <option value="Laboratorio">Laboratorio</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-[#4a5070] mb-1">DÍA</label>
                        <select value={sessDay} onChange={(e) => setSessDay(Number(e.target.value))} className="w-full bg-[#0d0f14] border border-[#2a2f45] rounded px-2 py-1 text-xs text-white">
                          {FULL_DAYS.map((d: string, idx: number) => (
                            <option key={d} value={idx}>{d}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-[#4a5070] mb-1">HORA INICIO</label>
                        <select value={sessHour} onChange={(e) => setSessHour(Number(e.target.value))} className="w-full bg-[#0d0f14] border border-[#2a2f45] rounded px-2 py-1 text-xs text-white">
                          {HOURS.map((h: number) => (
                            <option key={h} value={h}>{h}:00</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-[#4a5070] mb-1">DURACIÓN (HORAS)</label>
                        <select value={sessDuration} onChange={(e) => setSessDuration(Number(e.target.value))} className="w-full bg-[#0d0f14] border border-[#2a2f45] rounded px-2 py-1 text-xs text-white">
                          <option value={1}>1 hora</option>
                          <option value={2}>2 horas</option>
                          <option value={3}>3 horas</option>
                        </select>
                      </div>
                    </div>
                    <button onClick={addSession} className="w-full py-1.5 bg-[#2dd67b] text-black font-bold text-xs rounded hover:bg-[#25b868] transition-colors">
                      + Agregar Horario a {selectedCourse.shortName || selectedCourse.code}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-xs text-[#4a5070] font-mono">Selecciona o agrega un ramo para configurar sus horarios.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#2a2f45] flex justify-end gap-2 bg-[#151820]">
          <button onClick={onClose} className="px-4 py-1.5 text-xs font-semibold text-[#7c82a0] hover:text-white">Cancelar</button>
          <button
            onClick={() => {
              onSave(localCourses, localSessions);
              onClose();
            }}
            className="px-4 py-1.5 text-xs font-bold bg-[#4f7cff] hover:bg-[#3d6ae0] text-white rounded transition-colors"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
      {confirmDelete && (
        <ConfirmModal
          title={confirmDelete.type === 'course' ? "Eliminar ramo" : "Eliminar horario"}
          message={confirmDelete.type === 'course' ? "¿Seguro que deseas eliminar este ramo y todos sus horarios asociados?" : "¿Seguro que deseas eliminar este horario?"}
          confirmLabel="Sí, eliminar"
          onConfirm={() => {
            if (confirmDelete.type === 'course') removeCourse(confirmDelete.id);
            else removeSession(confirmDelete.id);
            setConfirmDelete(null);
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
