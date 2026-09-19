export type Priority = "Baja" | "Media" | "Alta" | "Critica";
export type Status = "Pendiente" | "En curso" | "Completada" | "En revisión" | "Cancelada";

export interface Activity {
  id: string;
  title: string;
  description: string;
  project: string;
  sprintId: string;
  category: string;
  members: string[];
  priority: Priority;
  status: Status;
  hours: number;
  dueDate: string;
}
