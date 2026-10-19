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
  dueTime?: string | null;
  status: "Pendiente" | "En curso" | "Completada";
  priority: "Alta" | "Media" | "Baja";
  notes?: string | null;
  /**
   * Actividad de Scrum que origina esta tarea. Solo lo traen las tareas
   * derivadas, que no existen en /tasks: se arman en memoria a partir de
   * /activities. Ver utils/scrumSync.ts.
   */
  scrumActivityId?: string;
  /** Proyecto de equipo al que pertenece la actividad derivada. */
  projectId?: string;
}
