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
