export type TaskType = "Tarea" | "Evaluación" | "Proyecto" | "Lectura";

export type TaskScope = "Ramo" | "Proyecto Universitario" | "Personal";

/**
 * Representa una tarea individual del estudiante en su organizador personal.
 */
export interface OrganizerTask {
    id: number
    userId: number                        // ID del estudiante dueño de la tarea
    title: string                          // Nombre/título de la actividad (ej: "Leer capítulo 4 de Tanenbaum")
    scope: TaskScope                       // Ámbito: "Ramo", "Proyecto Universitario", o "Personal"
    courseId?: number                      // ID del Ramo (Course) asociado
    type: TaskType                         // Tipo de actividad
    endDate: string                        // Fecha y hora límite (ej: "8 sept 23:59")
    status: "Pendiente" | "En curso" | "Completada"  // Estado en el organizador
    priority: "Alta" | "Media" | "Baja"    // Prioridad de la tarea
    notes?: string | null                  // Notas adicionales del estudiante
    scrumActivityId?: number | null        // ID de la actividad Scrum si viene de un trabajo grupal
}




