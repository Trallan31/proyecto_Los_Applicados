import type { Activity, OrganizerTask, Status } from "../types";

/**
 * Sincronizacion de Scrum hacia el Organizador Personal.
 *
 * Las actividades asignadas a un usuario aparecen en su Organizador como
 * tareas derivadas: no se guardan en /tasks, se arman en memoria a partir de
 * /activities cada vez que se renderiza. Asi nunca quedan copias
 * desactualizadas ni huerfanas si al usuario lo desasignan o si el equipo
 * borra la actividad.
 *
 * La unica edicion que acepta una tarea derivada es el estado, y ese cambio
 * se escribe de vuelta en la actividad, que es la fuente de verdad.
 */

/** Prefijo del id de una tarea derivada. El resto es el id de la actividad. */
const SCRUM_TASK_PREFIX = "scrum:";

export function isScrumTask(task: OrganizerTask): boolean {
  return task.scrumActivityId !== undefined;
}

/** Id de la actividad detras de una tarea derivada, o null si es propia. */
export function activityIdOf(taskId: string): string | null {
  return taskId.startsWith(SCRUM_TASK_PREFIX)
    ? taskId.slice(SCRUM_TASK_PREFIX.length)
    : null;
}

/**
 * El tablero maneja cinco estados y el Organizador tres. "En revision" se ve
 * como trabajo en curso y "Cancelada" como pendiente, que es lo mas cercano.
 */
function toTaskStatus(status: Status): OrganizerTask["status"] {
  if (status === "Completada") return "Completada";
  if (status === "En curso" || status === "En revisión") return "En curso";
  return "Pendiente";
}

/** El tablero tiene "Critica", que el Organizador no: se muestra como "Alta". */
function toTaskPriority(priority: Activity["priority"]): OrganizerTask["priority"] {
  return priority === "Critica" ? "Alta" : priority;
}

/** Arma la tarea que el Organizador muestra para una actividad asignada. */
export function activityToTask(activity: Activity, userId: string): OrganizerTask {
  return {
    id: `${SCRUM_TASK_PREFIX}${activity.id}`,
    userId,
    title: activity.title,
    scope: "Proyecto Universitario",
    courseId: null,
    type: "Proyecto",
    endDate: activity.dueDate,
    dueTime: null,
    status: toTaskStatus(activity.status),
    priority: toTaskPriority(activity.priority),
    notes: activity.description || null,
    scrumActivityId: activity.id,
    projectId: activity.projectId,
  };
}

/** Tareas derivadas de todas las actividades asignadas al usuario. */
export function assignedActivitiesAsTasks(
  activities: Activity[],
  userId: string
): OrganizerTask[] {
  if (!userId) return [];
  return activities
    .filter((activity) => activity.members.includes(userId))
    .map((activity) => activityToTask(activity, userId));
}
