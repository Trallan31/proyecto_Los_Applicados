export interface Project {
    id: number
    name: string
    description: string
    members: number[] // ids de los miembros del proyecto
    admins: number[]  // ids de los miembros con permisos de administrador
    createdAt: string
    updatedAt: string
}

