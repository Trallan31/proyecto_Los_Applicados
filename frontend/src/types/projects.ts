export type ProjectRole = "Admin" | "Miembro";

export type ProjectLinkCategory = "repositorio" | "diseño" | "documentación" | "deploy" | "otro";

export interface ProjectLink {
  id: string;
  title: string;
  url: string;
  category?: ProjectLinkCategory;
}

/** Pertenencia de un usuario a un proyecto. Va embebida en el proyecto. */
export interface ProjectMember {
  userId: string;
  role: ProjectRole;
}

/** Recurso /projects. Las tareas y los sprints son colecciones aparte. */
export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  course: string;
  categories: string[];
  members: ProjectMember[];
  links?: ProjectLink[];
}

