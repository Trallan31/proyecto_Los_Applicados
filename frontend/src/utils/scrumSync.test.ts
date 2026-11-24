import { describe, expect, it } from "vitest";
import {
  activityIdOf,
  activityToTask,
  assignedActivitiesAsTasks,
  isScrumTask,
} from "./scrumSync";
import type { Activity, OrganizerTask } from "../types";

function crearActividad(parcial: Partial<Activity> = {}): Activity {
  return {
    id: "act-1",
    projectId: "proj-1",
    sprintId: "spr-1",
    title: "Implementar endpoints",
    description: "Agregar rutas de autenticación",
    category: "Backend",
    members: ["u1"],
    priority: "Media",
    status: "Pendiente",
    hours: 4,
    dueDate: "2026-12-01",
    ...parcial,
  };
}

function crearTareaPropia(parcial: Partial<OrganizerTask> = {}): OrganizerTask {
  return {
    id: "t-1",
    userId: "u1",
    title: "Estudiar apuntes",
    scope: "Ramo",
    courseId: "c1",
    type: "Lectura",
    endDate: "2026-12-02",
    dueTime: null,
    status: "Pendiente",
    priority: "Media",
    ...parcial,
  };
}

describe("isScrumTask", () => {
  it("devuelve true cuando la tarea proviene de una actividad Scrum", () => {
    const tareaScrum = crearTareaPropia({
      id: "scrum:act-1",
      scrumActivityId: "act-1",
    });

    expect(isScrumTask(tareaScrum)).toBe(true);
  });

  it("devuelve false para tareas propias del organizador sin scrumActivityId", () => {
    const tareaPropia = crearTareaPropia();

    expect(isScrumTask(tareaPropia)).toBe(false);
  });
});

describe("activityIdOf", () => {
  it("extrae el id de la actividad cuando el id tiene prefijo 'scrum:'", () => {
    expect(activityIdOf("scrum:act-42")).toBe("act-42");
    expect(activityIdOf("scrum:")).toBe("");
  });

  it("devuelve null cuando el id no tiene prefijo 'scrum:'", () => {
    expect(activityIdOf("t-1")).toBeNull();
    expect(activityIdOf("")).toBeNull();
    expect(activityIdOf("otro:act-42")).toBeNull();
  });
});

describe("activityToTask", () => {
  it("mapea 'En revisión' a 'En curso', 'Critica' a 'Alta' y preserva scrumOriginalStatus", () => {
    const actividad = crearActividad({
      id: "act-99",
      projectId: "proj-7",
      title: "Revisar migración",
      description: "Validar índices en colección",
      status: "En revisión",
      priority: "Critica",
      dueDate: "2026-11-30",
    });

    const tarea = activityToTask(actividad, "u2");

    expect(tarea).toEqual({
      id: "scrum:act-99",
      userId: "u2",
      title: "Revisar migración",
      scope: "Proyecto Universitario",
      courseId: null,
      type: "Proyecto",
      endDate: "2026-11-30",
      dueTime: null,
      status: "En curso",
      scrumOriginalStatus: "En revisión",
      priority: "Alta",
      notes: "Validar índices en colección",
      scrumActivityId: "act-99",
      projectId: "proj-7",
    });
  });

  it("mapea el resto de estados y prioridades conservando scrumOriginalStatus", () => {
    const completada = activityToTask(
      crearActividad({ status: "Completada", priority: "Baja" }),
      "u1"
    );
    expect(completada.status).toBe("Completada");
    expect(completada.scrumOriginalStatus).toBe("Completada");
    expect(completada.priority).toBe("Baja");

    const enCurso = activityToTask(
      crearActividad({ status: "En curso", priority: "Alta" }),
      "u1"
    );
    expect(enCurso.status).toBe("En curso");
    expect(enCurso.scrumOriginalStatus).toBe("En curso");
    expect(enCurso.priority).toBe("Alta");

    const cancelada = activityToTask(
      crearActividad({ status: "Cancelada", priority: "Media" }),
      "u1"
    );
    expect(cancelada.status).toBe("Pendiente");
    expect(cancelada.scrumOriginalStatus).toBe("Cancelada");
    expect(cancelada.priority).toBe("Media");
  });

  it("asigna notes: null cuando description está vacía", () => {
    const tarea = activityToTask(crearActividad({ description: "" }), "u1");

    expect(tarea.notes).toBeNull();
  });
});

describe("assignedActivitiesAsTasks", () => {
  it("devuelve arreglo vacío cuando userId está vacío", () => {
    const actividades = [crearActividad({ members: ["u1"] })];

    expect(assignedActivitiesAsTasks(actividades, "")).toEqual([]);
  });

  it("excluye actividades con estado 'Cancelada' y actividades donde userId no es miembro", () => {
    const actividades: Activity[] = [
      crearActividad({ id: "a1", members: ["u1", "u2"], status: "Pendiente" }),
      crearActividad({ id: "a2", members: ["u1"], status: "Cancelada" }),
      crearActividad({ id: "a3", members: ["u2"], status: "En curso" }),
      crearActividad({ id: "a4", members: ["u1"], status: "En revisión" }),
    ];

    const tareas = assignedActivitiesAsTasks(actividades, "u1");

    expect(tareas.map((t) => t.id)).toEqual(["scrum:a1", "scrum:a4"]);
    expect(tareas[1].status).toBe("En curso");
    expect(tareas[1].scrumOriginalStatus).toBe("En revisión");
  });
});
