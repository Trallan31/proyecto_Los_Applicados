import type { User, Sprint, Activity, Priority, Status, Project } from "../types";

export const COLORS = ["#4f7cff", "#9b6dff", "#2dd67b", "#f5c842", "#ff8c42", "#ff5c6a", "#00c9b1", "#e879f9"];

export const ALL_USERS: User[] = [
  { id: "user-1", username: "mgonzalez", name: "María", lastName: "González", mail: "mgonzalez@uc.cl", initials: "MG", avatarColor: "#4f7cff" },
  { id: "user-2", username: "jperez", name: "Jorge", lastName: "Pérez", mail: "jperez@uc.cl", initials: "JP", avatarColor: "#9b6dff" },
  { id: "user-3", username: "apinto", name: "Ana", lastName: "Pinto", mail: "apinto@uc.cl", initials: "AP", avatarColor: "#2dd67b" },
  { id: "user-4", username: "kcastro", name: "Kevin", lastName: "Castro", mail: "kcastro@uc.cl", initials: "KC", avatarColor: "#ff8c42" },
  { id: "user-5", username: "lcampos", name: "Luis", lastName: "Campos", mail: "lcampos@uc.cl", initials: "LC", avatarColor: "#ff5c6a" }
];

export const ALL_SPRINTS: Sprint[] = [
  { id: "sprint-1", projectId: "project-1", name: "Sprint 1" },
  { id: "sprint-2", projectId: "project-1", name: "Sprint 2" },
  { id: "sprint-3", projectId: "project-1", name: "Sprint 3" },
  { id: "sprint-4", projectId: "project-2", name: "Sprint 1" },
  { id: "sprint-5", projectId: "project-2", name: "Sprint 2" }
];

export const ALL_ACTIVITIES: Activity[] = [
  { id: "activity-1", title: "Diseño de esquema E-R", description: "Usar notación de Chen", project: "project-1", sprintId: "sprint-1", category: "Diseño", members: ["user-1", "user-2"], priority: "Critica", status: "Completada", dueDate: "2026-08-20", hours: 4 },
  { id: "activity-2", title: "Normalización hasta 3FN", description: "", project: "project-1", sprintId: "sprint-1", category: "Backend", members: ["user-1"], priority: "Alta", status: "Completada", dueDate: "2026-08-22", hours: 2 },
  { id: "activity-3", title: "Implementar consultas SQL", description: "Joins y subconsultas", project: "project-1", sprintId: "sprint-2", category: "Backend", members: ["user-3"], priority: "Alta", status: "Completada", dueDate: "2026-09-01", hours: 6 },
  { id: "activity-4", title: "API REST endpoints", description: "Usar Express.js", project: "project-1", sprintId: "sprint-2", category: "Backend", members: ["user-2", "user-3"], priority: "Alta", status: "En revisión", dueDate: "2026-09-05", hours: 8 },
  { id: "activity-5", title: "Frontend búsqueda de libros", description: "", project: "project-1", sprintId: "sprint-3", category: "Frontend", members: ["user-1"], priority: "Alta", status: "En curso", dueDate: "2026-09-15", hours: 5 },
  { id: "activity-6", title: "Autenticación de usuarios", description: "JWT tokens", project: "project-1", sprintId: "sprint-3", category: "Backend", members: ["user-4"], priority: "Critica", status: "Pendiente", dueDate: "2026-09-12", hours: 4 },
  { id: "activity-7", title: "Pruebas de integración", description: "", project: "project-1", sprintId: "sprint-3", category: "QA", members: ["user-2"], priority: "Media", status: "Pendiente", dueDate: "2026-09-20", hours: 2 },
  { id: "activity-8", title: "Documentación técnica", description: "README + API docs", project: "project-1", sprintId: "sprint-3", category: "Docs", members: ["user-1", "user-4"], priority: "Baja", status: "Cancelada", dueDate: "2026-09-25", hours: 3 },
  { id: "activity-9", title: "Diagrama de clases UML", description: "", project: "project-2", sprintId: "sprint-4", category: "Diseño", members: ["user-1"], priority: "Alta", status: "Completada", dueDate: "2026-09-05", hours: 3 },
  { id: "activity-10", title: "Implementar patrón MVC", description: "", project: "project-2", sprintId: "sprint-4", category: "Backend", members: ["user-5"], priority: "Critica", status: "En curso", dueDate: "2026-09-12", hours: 10 },
  { id: "activity-11", title: "Tests unitarios Auth", description: "", project: "project-2", sprintId: "sprint-5", category: "QA", members: ["user-1"], priority: "Media", status: "Pendiente", dueDate: "2026-09-20", hours: 4 },
];

export const INITIAL_PROJECTS: Project[] = [
  { 
    id: "project-1", 
    name: "Sistema de Biblioteca", 
    description: "Proyecto universitario",
    color: "#4f7cff",
    course: "Bases de Datos",
    categories: ["Diseño", "Backend", "Frontend", "QA", "Docs"], 
    members: [
      { ...ALL_USERS[0], role: "Admin" },
      { ...ALL_USERS[1], role: "Miembro" },
      { ...ALL_USERS[2], role: "Miembro" },
      { ...ALL_USERS[3], role: "Miembro" }
    ],
    tasks: ALL_ACTIVITIES.filter(a => a.project === "project-1")
  }, 
  { 
    id: "project-2", 
    name: "App Gestión de Pedidos", 
    description: "Aplicación web",
    color: "#ff5c6a",
    course: "Ingeniería de Software",
    categories: ["Diseño", "Backend", "QA"], 
    members: [
      { ...ALL_USERS[0], role: "Admin" },
      { ...ALL_USERS[4], role: "Miembro" }
    ],
    tasks: ALL_ACTIVITIES.filter(a => a.project === "project-2")
  }
];

export const PRIORITY_META: Record<Priority, { color: string; bg: string }> = {
  "Critica": { color: "#ff5c6a", bg: "rgba(255,92,106,0.12)" },
  "Alta":    { color: "#ff8c42", bg: "rgba(255,140,66,0.12)" },
  "Media":   { color: "#f5c842", bg: "rgba(245,200,66,0.12)" },
  "Baja":    { color: "#2dd67b", bg: "rgba(45,214,123,0.12)" },
};

export const STATUS_META: Record<Status, { color: string; bg: string; dot: string }> = {
  "Pendiente":    { color: "#7c82a0", bg: "rgba(124,130,160,0.12)", dot: "#7c82a0" },
  "En curso":     { color: "#f5c842", bg: "rgba(245,200,66,0.12)", dot: "#f5c842" },
  "En revisión":  { color: "#9b6dff", bg: "rgba(155,109,255,0.12)", dot: "#9b6dff" },
  "Completada":   { color: "#2dd67b", bg: "rgba(45,214,123,0.12)", dot: "#2dd67b" },
  "Cancelada":    { color: "#ff5c6a", bg: "rgba(255,92,106,0.12)", dot: "#ff5c6a" },
};

/** Unica fuente de prioridades y estados para desplegables y filtros. */
export const PRIORITIES = Object.keys(PRIORITY_META) as Priority[];
export const STATUSES = Object.keys(STATUS_META) as Status[];