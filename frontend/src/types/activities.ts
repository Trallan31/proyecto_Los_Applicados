export type Priority = "Baja" | "Media" | "Alta" | "Critica";
export type Status = "Pendiente" | "En curso" | "Completada" | "En revisión" | "Cancelada";

export interface Activity {
  id: string | number;
  title: string;
  description: string;
  project: number | string;
  sprintId: number;
  category: string;
  members: number[];
  priority: Priority;
  status: Status;
  hours: number;
  dueDate: string;
}
