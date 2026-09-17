export interface Activity {
    id: number
    name: string
    description: string
    project: number // id del proyecto al que la actividad pertenece
    members: number[] // ids de los miembros con esta actividad asignada
    status: string  // estado de la actividad (en progreso, finalizada, etc.)
    priority: string // prioridad de la actividad
    endDate: string // fecha limite
    extra: string | null // informacion extra
    createdAt: string
    updatedAt: string
}

