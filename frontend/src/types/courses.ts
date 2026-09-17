/**
 * Representa un Ramo o materia de la universidad del estudiante.
 */
export interface Course {
    id: number
    userId: number // ID del estudiante al que le pertenece el ramo
    name: string // Nombre del ramo (ej: "Cálculo III")
    shortName: string // Siglas del ramo (ej: "CAL")
    color: string // Color en formato hexadecimal para pintar el ramo en la interfaz
    createdAt: string
    updatedAt: string
}

export type SessionType = "Cátedra" | "Auxiliar" | "Laboratorio";

/**
 * Representa un bloque de horario asociado a un ramo.
 */
export interface CourseSession {
    id: number
    courseId: number // A qué ramo pertenece este horario
    dayOfWeek: number // 0 = Lunes, 1 = Martes, 2 = Miércoles, 3 = Jueves, 4 = Viernes
    startHour: number // Hora de inicio (ej: 8 para las 8:00 AM)
    duration: number // Cuántas horas dura el bloque (ej: 2)
    type: SessionType
    createdAt: string
    updatedAt: string
}
