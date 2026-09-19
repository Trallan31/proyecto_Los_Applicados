import type { User } from "../types/users";
import type { Sprint } from "../types/sprints";
import type { Activity, Priority, Status } from "../types/activities";
import type { Project } from "../types/projects";

export const COLORS = ["#4f7cff", "#9b6dff", "#2dd67b", "#f5c842", "#ff8c42", "#ff5c6a", "#00c9b1", "#e879f9"];

export const ALL_USERS: User[] = [
  { id: 1, username: "mgonzalez", name: "María", lastName: "González", mail: "mgonzalez@uc.cl", initials: "MG", avatarColor: "#4f7cff" },
  { id: 2, username: "jperez", name: "Jorge", lastName: "Pérez", mail: "jperez@uc.cl", initials: "JP", avatarColor: "#9b6dff" },
  { id: 3, username: "apinto", name: "Ana", lastName: "Pinto", mail: "apinto@uc.cl", initials: "AP", avatarColor: "#2dd67b" },
  { id: 4, username: "kcastro", name: "Kevin", lastName: "Castro", mail: "kcastro@uc.cl", initials: "KC", avatarColor: "#ff8c42" },
  { id: 5, username: "lcampos", name: "Luis", lastName: "Campos", mail: "lcampos@uc.cl", initials: "LC", avatarColor: "#ff5c6a" }
];

export const ALL_SPRINTS: Sprint[] = [
  { id: 1, projectId: 1, name: "Sprint 1" },
  { id: 2, projectId: 1, name: "Sprint 2" },
  { id: 3, projectId: 1, name: "Sprint 3" },
  { id: 4, projectId: 2, name: "Sprint 1" },
  { id: 5, projectId: 2, name: "Sprint 2" }
];

export const ALL_ACTIVITIES: Activity[] = [
  { id: 1, title: "Diseño de esquema E-R", description: "Usar notación de Chen", project: 1, sprintId: 1, category: "Diseño", members: [1, 2], priority: "Critica", status: "Completada", dueDate: "2026-08-20", hours: 4 },
  { id: 2, title: "Normalización hasta 3FN", description: "", project: 1, sprintId: 1, category: "Backend", members: [1], priority: "Alta", status: "Completada", dueDate: "2026-08-22", hours: 2 },
  { id: 3, title: "Implementar consultas SQL", description: "Joins y subconsultas", project: 1, sprintId: 2, category: "Backend", members: [3], priority: "Alta", status: "Completada", dueDate: "2026-09-01", hours: 6 },
  { id: 4, title: "API REST endpoints", description: "Usar Express.js", project: 1, sprintId: 2, category: "Backend", members: [2, 3], priority: "Alta", status: "En revisión", dueDate: "2026-09-05", hours: 8 },
  { id: 5, title: "Frontend búsqueda de libros", description: "", project: 1, sprintId: 3, category: "Frontend", members: [1], priority: "Alta", status: "En curso", dueDate: "2026-09-15", hours: 5 },
  { id: 6, title: "Autenticación de usuarios", description: "JWT tokens", project: 1, sprintId: 3, category: "Backend", members: [4], priority: "Critica", status: "Pendiente", dueDate: "2026-09-12", hours: 4 },
  { id: 7, title: "Pruebas de integración", description: "", project: 1, sprintId: 3, category: "QA", members: [2], priority: "Media", status: "Pendiente", dueDate: "2026-09-20", hours: 2 },
  { id: 8, title: "Documentación técnica", description: "README + API docs", project: 1, sprintId: 3, category: "Docs", members: [1, 4], priority: "Baja", status: "Cancelada", dueDate: "2026-09-25", hours: 3 },
  { id: 9, title: "Diagrama de clases UML", description: "", project: 2, sprintId: 1, category: "Diseño", members: [1], priority: "Alta", status: "Completada", dueDate: "2026-09-05", hours: 3 },
  { id: 10, title: "Implementar patrón MVC", description: "", project: 2, sprintId: 1, category: "Backend", members: [5], priority: "Critica", status: "En curso", dueDate: "2026-09-12", hours: 10 },
  { id: 11, title: "Tests unitarios Auth", description: "", project: 2, sprintId: 2, category: "QA", members: [1], priority: "Media", status: "Pendiente", dueDate: "2026-09-20", hours: 4 },
];

export const INITIAL_PROJECTS: Project[] = [
  { 
    id: 1, 
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
    tasks: ALL_ACTIVITIES.filter(a => a.project === 1),
    sprints: ALL_SPRINTS.filter(s => s.projectId === 1)
  }, 
  { 
    id: 2, 
    name: "App Gestión de Pedidos", 
    description: "Aplicación web",
    color: "#ff5c6a",
    course: "Ingeniería de Software",
    categories: ["Diseño", "Backend", "QA"], 
    members: [
      { ...ALL_USERS[0], role: "Admin" },
      { ...ALL_USERS[4], role: "Miembro" }
    ],
    tasks: ALL_ACTIVITIES.filter(a => a.project === 2),
    sprints: ALL_SPRINTS.filter(s => s.projectId === 2)
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