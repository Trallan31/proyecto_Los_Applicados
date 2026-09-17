/**
 * Representa un proyecto colaborativo de equipo utilizando metodología Scrum.
 */
export interface Project {
    id: number
    name: string
    description: string
    courseId?: number // ID del ramo asociado si es un proyecto universitario (el color se hereda de este ramo)
    categories: string[] // lista de categorías personalizadas del proyecto (ej: ["Backend", "Frontend", "Diseño"])
    members: number[]    // ids de los miembros del proyecto
    admins: number[]     // ids de los miembros con permisos de administrador
    createdAt: string
    updatedAt: string
}



