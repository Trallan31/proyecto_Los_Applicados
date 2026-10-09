import { useState } from 'react';
import type { Course, CourseSession, SessionType } from "../../../types";
import { FULL_DAYS, HOURS } from "../../../utils/dateUtils";
import { PALETTE } from "../../../constants/ui";
import { ConfirmModal } from "../../shared/ConfirmModal";

export function ManageCoursesModal({
  courses,
  sessions,
  onAddCourse,
  onDeleteCourse,
  onAddSession,
  onDeleteSession,
  onClose,
}: {
  courses: Course[];
  sessions: CourseSession[];
  onAddCourse: (c: Omit<Course, "id" | "userId">) => void;
  onDeleteCourse: (id: string) => void;
  onAddSession: (s: Omit<CourseSession, "id">) => void;
  onDeleteSession: (id: string) => void;
  onClose: () => void;
}) {
  // El ramo seleccionado es lo unico que el modal guarda: el resto son los
  // datos que vienen de la API, que se actualizan solos al escribir.
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'course' | 'session'; id: string } | null>(null);

  // New Course Inputs
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newColor, setNewColor] = useState(PALETTE[0]);

  // New Session Inputs for Active Course
  const [sessType, setSessType] = useState<SessionType>("Cátedra");
  const [sessDay, setSessDay] = useState(0);
  const [sessHour, setSessHour] = useState(8);
  const [sessDuration, setSessDuration] = useState(2);

  function handleAddCourse() {
    if (!newName.trim() || !newCode.trim()) return;
    const codeUpper = newCode.trim().toUpperCase();
    onAddCourse({
      name: newName.trim(),
      code: codeUpper,
      shortName: codeUpper.slice(0, 4),
      color: newColor,
    });
    setNewName("");
    setNewCode("");
  }

  function handleAddSession() {
    if (!selectedCourse) return;
    onAddSession({
      courseId: selectedCourse.id,
      dayOfWeek: sessDay,
      startHour: sessHour,
      duration: sessDuration,
      type: sessType,
    });
  }

  // Si no hay seleccion explicita, o el ramo elegido se borro, cae al primero.
  const selectedCourse = courses.find((c) => c.id === selectedCourseId) ?? courses[0];
  const courseSessions = sessions.filter((s) => s.courseId === selectedCourse?.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-panel border border-border rounded-xl w-full max-w-2xl mx-4 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-surface">
          <h2 className="font-display font-bold text-[15px] text-text">Gestionar Ramos y Horarios de Clases</h2>
          <button onClick={onClose} className="text-text-dim hover:text-text text-lg">✕</button>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left Course List */}
          <div className="w-1/2 border-r border-border flex flex-col p-4 bg-surface">
            <h3 className="text-xs font-mono font-bold text-text-muted uppercase mb-3">Mis Ramos ({courses.length})</h3>
            <div className="flex-1 overflow-y-auto scrollbar-hide space-y-2 pr-1">
              {courses.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCourseId(c.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                    selectedCourse?.id === c.id ? "bg-panel border-[#4f7cff]" : "bg-background border-border hover:border-border-bright"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                    <div className="truncate">
                      <p className="text-xs font-bold text-text truncate">{c.name}</p>
                      <p className="text-[10px] font-mono text-[#4f7cff] font-semibold">{c.code || c.shortName}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDelete({ type: 'course', id: c.id });
                    }}
                    className="text-text-dim hover:text-[#ff5c6a] transition-colors text-xs font-bold p-1 ml-2"
                    title="Eliminar ramo"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Form to add new Course */}
            <div className="mt-4 pt-3 border-t border-border space-y-2">
              <span className="text-[10px] font-mono text-text-dim uppercase font-bold">Agregar nuevo ramo</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nombre ramo..."
                  className="bg-background border border-border rounded px-2.5 py-1 text-xs text-text placeholder-text-dim focus:outline-none focus:border-[#4f7cff]"
                />
                <input
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="Código (ej: IIC2143)..."
                  className="bg-background border border-border rounded px-2.5 py-1 text-xs text-text placeholder-text-dim focus:outline-none focus:border-[#4f7cff]"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {PALETTE.slice(0, 6).map((pc: string) => (
                    <button
                      key={pc}
                      onClick={() => setNewColor(pc)}
                      className="w-4 h-4 rounded-full transition-transform hover:scale-110"
                      style={{ backgroundColor: pc, outline: newColor === pc ? `2px solid ${pc}` : "none", outlineOffset: 1 }}
                    />
                  ))}
                </div>
                <button
                  onClick={handleAddCourse}
                  disabled={!newName.trim() || !newCode.trim()}
                  className="px-3 py-1 bg-[#4f7cff] text-white rounded text-xs font-bold hover:bg-[#3d6ae0] disabled:opacity-40"
                >
                  + Ramo
                </button>
              </div>
            </div>
          </div>

          {/* Right Session Schedule Manager for Selected Course */}
          <div className="w-1/2 flex flex-col p-4 bg-panel overflow-y-auto scrollbar-hide">
            {selectedCourse ? (
              <>
                <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-text flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedCourse.color }} />
                      {selectedCourse.name}
                    </h3>
                    <p className="text-[10px] font-mono text-[#4f7cff] font-semibold">{selectedCourse.code}</p>
                  </div>
                </div>

                <div className="space-y-3 flex-1">
                  <h4 className="text-xs font-mono font-bold text-text-muted uppercase">Horarios de Clases / Cátedras / Labs</h4>
                  
                  {/* List of sessions for this course */}
                  <div className="space-y-2">
                    {courseSessions.map((s) => (
                      <div key={s.id} className="flex items-center justify-between p-2.5 rounded bg-background border border-border">
                        <div>
                          <span className="text-xs font-semibold text-text">{FULL_DAYS[s.dayOfWeek]}</span>
                          <p className="text-[10px] font-mono text-text-muted">
                            {s.startHour}:00 - {s.startHour + s.duration}:00 ({s.type})
                          </p>
                        </div>
                        <button onClick={() => setConfirmDelete({ type: 'session', id: s.id })} className="text-text-dim hover:text-[#ff5c6a] text-xs font-bold">
                          ✕
                        </button>
                      </div>
                    ))}
                    {courseSessions.length === 0 && (
                      <p className="text-xs text-text-dim font-mono italic">Sin horarios registrados para este ramo.</p>
                    )}
                  </div>

                  {/* Add Session Form */}
                  <div className="mt-4 pt-3 border-t border-border space-y-3">
                    <h5 className="text-[10px] font-mono font-bold text-[#4f7cff] uppercase">+ Añadir Horario de Clase</h5>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-mono text-text-dim mb-1">TIPO</label>
                        <select value={sessType} onChange={(e) => setSessType(e.target.value as SessionType)} className="w-full bg-background border border-border rounded px-2 py-1 text-xs text-text">
                          <option value="Cátedra">Cátedra</option>
                          <option value="Auxiliar">Auxiliar</option>
                          <option value="Laboratorio">Laboratorio</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-text-dim mb-1">DÍA</label>
                        <select value={sessDay} onChange={(e) => setSessDay(Number(e.target.value))} className="w-full bg-background border border-border rounded px-2 py-1 text-xs text-text">
                          {FULL_DAYS.map((d: string, idx: number) => (
                            <option key={d} value={idx}>{d}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-text-dim mb-1">HORA INICIO</label>
                        <select value={sessHour} onChange={(e) => setSessHour(Number(e.target.value))} className="w-full bg-background border border-border rounded px-2 py-1 text-xs text-text">
                          {HOURS.map((h: number) => (
                            <option key={h} value={h}>{h}:00</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-text-dim mb-1">DURACIÓN (HORAS)</label>
                        <select value={sessDuration} onChange={(e) => setSessDuration(Number(e.target.value))} className="w-full bg-background border border-border rounded px-2 py-1 text-xs text-text">
                          <option value={1}>1 hora</option>
                          <option value={2}>2 horas</option>
                          <option value={3}>3 horas</option>
                        </select>
                      </div>
                    </div>
                    <button onClick={handleAddSession} className="w-full py-1.5 bg-[#2dd67b] text-black font-bold text-xs rounded hover:bg-[#25b868] transition-colors">
                      + Agregar Horario a {selectedCourse.shortName || selectedCourse.code}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-xs text-text-dim font-mono">Selecciona o agrega un ramo para configurar sus horarios.</p>
            )}
          </div>
        </div>

        {/* Footer: cada cambio ya quedo guardado en la API al hacerlo. */}
        <div className="px-5 py-3 border-t border-border flex items-center justify-between bg-surface">
          <span className="text-[10px] font-mono text-text-dim">Los cambios se guardan al instante</span>
          <button onClick={onClose} className="px-4 py-1.5 text-xs font-bold bg-[#4f7cff] hover:bg-[#3d6ae0] text-white rounded transition-colors">
            Listo
          </button>
        </div>
      </div>
      {confirmDelete && (
        <ConfirmModal
          title={confirmDelete.type === 'course' ? "Eliminar ramo" : "Eliminar horario"}
          message={confirmDelete.type === 'course' ? "¿Seguro que deseas eliminar este ramo y todos sus horarios asociados?" : "¿Seguro que deseas eliminar este horario?"}
          confirmLabel="Sí, eliminar"
          onConfirm={() => {
            if (confirmDelete.type === 'course') onDeleteCourse(confirmDelete.id);
            else onDeleteSession(confirmDelete.id);
            setConfirmDelete(null);
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
