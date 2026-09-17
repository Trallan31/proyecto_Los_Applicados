/**
 * Representa a un usuario registrado en la plataforma.
 */
export interface User {
    id: number
    username: string
    name: string
    lastName: string
    mail: string
    password?: string
    initials?: string // iniciales, ej: "MG"
    avatarColor?: string // color para la interfaz visual
    courses: string[] // lista de ramos/asignaturas en los que está inscrito el estudiante
    createdAt: string
    updatedAt: string
}




