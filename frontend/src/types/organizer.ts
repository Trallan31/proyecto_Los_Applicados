export type TaskType = "Tarea" | "Evaluación" | "Proyecto" | "Lectura";
export type TaskScope = "Ramo" | "Proyecto Universitario" | "Personal";

export interface OrganizerTask {
  id: string;
  userId: string;
  title: string;
  scope: TaskScope;
  courseId?: string;
  type: TaskType;
  endDate: string;
  dueTime?: string;
  status: "Pendiente" | "En curso" | "Completada";
  priority: "Alta" | "Media" | "Baja";
  notes?: string;
  scrumActivityId?: number | null;
}