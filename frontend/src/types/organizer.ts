export type TaskType = "Tarea" | "Evaluación" | "Proyecto" | "Lectura";
export type TaskScope = "Ramo" | "Proyecto Universitario" | "Personal";

/** Tarea del organizador personal. Recurso /tasks. */
export interface OrganizerTask {
  id: string;
  userId: string;
  title: string;
  scope: TaskScope;
  /** Ramo al que pertenece, o null si es una tarea personal. */
  courseId: string | null;
  type: TaskType;
  endDate: string;
  dueTime?: string;
  status: "Pendiente" | "En curso" | "Completada";
  priority: "Alta" | "Media" | "Baja";
  notes?: string;
}
