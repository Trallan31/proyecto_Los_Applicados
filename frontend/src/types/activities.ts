/**
 * Representa una tarea de equipo en un proyecto gestionado con la metodología Scrum.
 */
export interface Activity {
    id: number
    description: string // descripción / nombre de la tarea
    project: number // id del proyecto al que la actividad pertenece
    sprintId: number // sprint asignado
    members: number[] // ids de los miembros con esta actividad asignada
    status: "Completada" | "En revisión" | "En progreso" | "Por hacer" | "No asignada" // estado de la actividad
    priority: "Baja" | "Media" | "Alta" | "Critica" // prioridad de la actividad
    hours: number // horas estimadas que tomará la tarea
    endDate: string // fecha limite
    notes: string | null // notas adicionales sobre la tarea
    createdAt: string
    updatedAt: string
}





