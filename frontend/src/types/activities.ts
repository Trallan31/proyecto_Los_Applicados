export type Priority = "Baja" | "Media" | "Alta" | "Critica";
export type Status = "Pendiente" | "En curso" | "Completada" | "En revisión" | "Cancelada";

/** Tarea de un proyecto de equipo. Recurso /activities. */
export interface Activity {
  id: string;
  projectId: string;
  sprintId: string;
  title: string;
  description: string;
  category: string;
  members: string[]; // ids de usuario
  priority: Priority;
  status: Status;
  hours: number;
  dueDate: string;
  /**
   * Posicion de la tarea dentro del tablero, para el drag & drop.
   * Es opcional: las actividades creadas antes de esta funcion no la traen
   * y se ordenan al final con 0.
   */
  order?: number;
}
