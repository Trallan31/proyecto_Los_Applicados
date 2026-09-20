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
}
