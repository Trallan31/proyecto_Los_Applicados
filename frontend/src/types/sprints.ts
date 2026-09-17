/**
 * Representa un ciclo de trabajo (Sprint) en Scrum.
 */
export interface Sprint {
    id: number
    projectId: number // ID del proyecto al que pertenece este sprint
    name: string // Nombre del sprint (ej: "Sprint 1")
    startDate: string // Fecha de inicio
    endDate: string // Fecha de término
    createdAt: string
    updatedAt: string
}
