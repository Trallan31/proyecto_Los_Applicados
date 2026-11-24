import { useState } from 'react';
import type { Course, CourseSession, SessionType } from "../../../types";
import { FULL_DAYS, HOURS } from "../../../utils/dateUtils";
import { PALETTE, getAccessibleColor } from "../../../constants/ui";
import { useIsDark } from "../../../context/ThemeContext";
import { ConfirmModal } from "../../shared/ConfirmModal";
import { Modal } from "../../shared/Modal";

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
  onAddCourse: (c: Omit<Course, "id" | "userId">) => Promise<boolean> | boolean;
  onDeleteCourse: (id: string) => Promise<boolean> | boolean;
  onAddSession: (s: Omit<CourseSession, "id">) => Promise<boolean> | boolean;
  onDeleteSession: (id: string) => Promise<boolean> | boolean;
  onClose: () => void;
}) {
  // El ramo seleccionado es lo único que el modal guarda: el resto son los
  // datos que vienen de la API, que se actualizan solos al escribir.
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'course' | 'session'; id: string } | null>(null);
  const isDark = useIsDark();

  // Entradas para nuevo ramo
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newColor, setNewColor] = useState(PALETTE[0]);
  const [submittingCourse, setSubmittingCourse] = useState(false);

  // Entradas para nuevo horario del ramo activo
  const [sessType, setSessType] = useState<SessionType>("Cátedra");
  const [sessDay, setSessDay] = useState(0);
  const [sessHour, setSessHour] = useState(8);
  const [sessDuration, setSessDuration] = useState(2);
  const [submittingSession, setSubmittingSession] = useState(false);

  async function handleAddCourse() {
    if (submittingCourse || !newName.trim() || !newCode.trim()) return;
    const codeUpper = newCode.trim().toUpperCase();
    setSubmittingCourse(true);
    try {
      const ok = await onAddCourse({
        name: newName.trim(),
        code: codeUpper,
        shortName: codeUpper.slice(0, 4),
        color: newColor,
      });
      // Solo limpia los campos si el ramo se creó correctamente.
      if (ok) {
        setNewName("");
        setNewCode("");
      }
    } finally {
      setSubmittingCourse(false);
    }
  }

  async function handleAddSession() {
    if (submittingSession || !selectedCourse) return;
    setSubmittingSession(true);
    try {
      await onAddSession({
        courseId: selectedCourse.id,
        dayOfWeek: sessDay,
        startHour: sessHour,
        duration: sessDuration,
        type: sessType,
      });
    } finally {
      setSubmittingSession(false);
    }
  }

  // Si no hay selección explícita, o el ramo elegido se borró, cae al primero.
  const selectedCourse = courses.find((c) => c.id === selectedCourseId) ?? courses[0];
  const courseSessions = sessions.filter((s) => s.courseId === selectedCourse?.id);

  return (
    <>
      <Modal
        isOpen={true}
        onClose={onClose}
        titleId="manage-courses-modal-title"
        maxWidthClass="max-w-2xl"
        className="bg-panel overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-surface">
          <h2 id="manage-courses-modal-title" className="font-display font-bold text-[15px] text-text">
            Gestionar Ramos y Horarios de Clases
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar gestión de ramos"
            title="Cerrar"
            className="text-text-muted hover:text-text text-lg leading-none p-1 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Lista izquierda de ramos */}
          <div className="w-1/2 border-r border-border flex flex-col p-4 bg-surface">
            <h3 className="text-xs font-mono font-bold text-text-muted uppercase mb-3">
              Mis Ramos ({courses.length})
            </h3>
            <div className="flex-1 overflow-y-auto scrollbar-hide space-y-2 pr-1">
              {courses.map((c) => {
                const isSelected = selectedCourse?.id === c.id;
                const dotColor = getAccessibleColor(c.color, isDark);
                return (
                  <div
                    key={c.id}
                    className={`rounded-lg border transition-all flex items-center justify-between ${
                      isSelected ? "bg-panel border-accent-blue" : "bg-background border-border hover:border-border-bright"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedCourseId(c.id)}
                      aria-pressed={isSelected}
                      className="flex-1 min-w-0 flex items-center gap-2.5 p-3 text-left cursor-pointer rounded-l-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
                    >
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />
                      <span className="truncate block min-w-0">
                        <span className="block text-xs font-bold text-text truncate">{c.name}</span>
                        <span className="block text-[10px] font-mono text-accent-blue font-semibold">
                          {c.code || c.shortName}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete({ type: 'course', id: c.id })}
                      className="text-text-muted hover:text-accent-red transition-colors text-xs font-bold p-2 mr-1 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-red"
                      title={`Eliminar ramo ${c.name}`}
                      aria-label={`Eliminar ramo ${c.name}`}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Formulario para agregar nuevo ramo */}
            <div className="mt-4 pt-3 border-t border-border space-y-2">
              <span className="text-[10px] font-mono text-text-muted uppercase font-bold">Agregar nuevo ramo</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nombre ramo..."
                  aria-label="Nombre del nuevo ramo"
                  className="bg-background border border-border rounded px-2.5 py-1 text-xs text-text placeholder-text-muted focus:outline-none focus:border-accent-blue"
                />
                <input
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="Código (ej: IIC2143)..."
                  aria-label="Código del nuevo ramo"
                  className="bg-background border border-border rounded px-2.5 py-1 text-xs text-text placeholder-text-muted focus:outline-none focus:border-accent-blue"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-1" role="group" aria-label="Color del ramo">
                  {PALETTE.slice(0, 6).map((pc: string) => {
                    const swatchColor = getAccessibleColor(pc, isDark);
                    return (
                      <button
                        key={pc}
                        type="button"
                        onClick={() => setNewColor(pc)}
                        aria-label={`Color ${pc}`}
                        aria-pressed={newColor === pc}
                        className="w-4 h-4 rounded-full transition-transform hover:scale-110 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
                        style={{
                          backgroundColor: swatchColor,
                          outline: newColor === pc ? `2px solid ${swatchColor}` : "none",
                          outlineOffset: 1,
                        }}
                      />
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => void handleAddCourse()}
                  disabled={submittingCourse || !newName.trim() || !newCode.trim()}
                  className="px-3 py-1 bg-accent-blue text-white rounded text-xs font-bold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {submittingCourse ? "Guardando..." : "+ Ramo"}
                </button>
              </div>
            </div>
          </div>

          {/* Gestor derecho de horarios del ramo seleccionado */}
          <div className="w-1/2 flex flex-col p-4 bg-panel overflow-y-auto scrollbar-hide">
            {selectedCourse ? (
              <>
                <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-text flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: getAccessibleColor(selectedCourse.color, isDark) }}
                      />
                      {selectedCourse.name}
                    </h3>
                    <p className="text-[10px] font-mono text-accent-blue font-semibold">{selectedCourse.code}</p>
                  </div>
                </div>

                <div className="space-y-3 flex-1">
                  <h4 className="text-xs font-mono font-bold text-text-muted uppercase">
                    Horarios de Clases / Cátedras / Labs
                  </h4>

                  {/* Lista de horarios del ramo */}
                  <div className="space-y-2">
                    {courseSessions.map((s) => (
                      <div key={s.id} className="flex items-center justify-between p-2.5 rounded bg-background border border-border">
                        <div>
                          <span className="text-xs font-semibold text-text">{FULL_DAYS[s.dayOfWeek]}</span>
                          <p className="text-[10px] font-mono text-text-muted">
                            {s.startHour}:00 - {s.startHour + s.duration}:00 ({s.type})
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete({ type: 'session', id: s.id })}
                          aria-label={`Eliminar horario de ${FULL_DAYS[s.dayOfWeek]} ${s.startHour}:00`}
                          title="Eliminar horario"
                          className="text-text-muted hover:text-accent-red transition-colors text-xs font-bold p-1 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-red"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {courseSessions.length === 0 && (
                      <p className="text-xs text-text-muted font-mono italic">Sin horarios registrados para este ramo.</p>
                    )}
                  </div>

                  {/* Formulario para agregar horario */}
                  <div className="mt-4 pt-3 border-t border-border space-y-3">
                    <h5 className="text-[10px] font-mono font-bold text-accent-blue uppercase">+ Añadir Horario de Clase</h5>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label htmlFor="sess-type" className="block text-[10px] font-mono text-text-muted font-semibold mb-1 cursor-pointer">TIPO</label>
                        <select id="sess-type" value={sessType} onChange={(e) => setSessType(e.target.value as SessionType)} className="w-full bg-background border border-border rounded px-2 py-1 text-xs text-text cursor-pointer">
                          <option value="Cátedra">Cátedra</option>
                          <option value="Auxiliar">Auxiliar</option>
                          <option value="Laboratorio">Laboratorio</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="sess-day" className="block text-[10px] font-mono text-text-muted font-semibold mb-1 cursor-pointer">DÍA</label>
                        <select id="sess-day" value={sessDay} onChange={(e) => setSessDay(Number(e.target.value))} className="w-full bg-background border border-border rounded px-2 py-1 text-xs text-text cursor-pointer">
                          {FULL_DAYS.map((d: string, idx: number) => (
                            <option key={d} value={idx}>{d}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="sess-hour" className="block text-[10px] font-mono text-text-muted font-semibold mb-1 cursor-pointer">HORA INICIO</label>
                        <select id="sess-hour" value={sessHour} onChange={(e) => setSessHour(Number(e.target.value))} className="w-full bg-background border border-border rounded px-2 py-1 text-xs text-text cursor-pointer">
                          {HOURS.map((h: number) => (
                            <option key={h} value={h}>{h}:00</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="sess-duration" className="block text-[10px] font-mono text-text-muted font-semibold mb-1 cursor-pointer">DURACIÓN (HORAS)</label>
                        <select id="sess-duration" value={sessDuration} onChange={(e) => setSessDuration(Number(e.target.value))} className="w-full bg-background border border-border rounded px-2 py-1 text-xs text-text cursor-pointer">
                          <option value={1}>1 hora</option>
                          <option value={2}>2 horas</option>
                          <option value={3}>3 horas</option>
                        </select>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={submittingSession}
                      onClick={() => void handleAddSession()}
                      className="w-full py-1.5 bg-accent-green text-white dark:text-black font-bold text-xs rounded hover:opacity-90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {submittingSession
                        ? "Guardando..."
                        : `+ Agregar Horario a ${selectedCourse.shortName || selectedCourse.code}`}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-xs text-text-muted font-mono">Selecciona o agrega un ramo para configurar sus horarios.</p>
            )}
          </div>
        </div>

        {/* Pie: cada cambio ya quedó guardado en la API al hacerlo. */}
        <div className="px-5 py-3 border-t border-border flex items-center justify-between bg-surface">
          <span className="text-[10px] font-mono text-text-muted">Los cambios se guardan al instante</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold bg-accent-blue hover:opacity-90 text-white rounded transition-colors cursor-pointer"
          >
            Listo
          </button>
        </div>
      </Modal>

      {confirmDelete && (
        <ConfirmModal
          title={confirmDelete.type === 'course' ? "Eliminar ramo" : "Eliminar horario"}
          message={confirmDelete.type === 'course' ? "¿Seguro que deseas eliminar este ramo y todos sus horarios asociados?" : "¿Seguro que deseas eliminar este horario?"}
          confirmLabel="Sí, eliminar"
          onConfirm={async () => {
            const ok =
              confirmDelete.type === 'course'
                ? await onDeleteCourse(confirmDelete.id)
                : await onDeleteSession(confirmDelete.id);
            if (ok) setConfirmDelete(null);
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </>
  );
}
