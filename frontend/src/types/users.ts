import type { ProjectRole } from "./projects";

/** Recurso /users. */
export interface User {
  id: string;
  username: string;
  name: string;
  lastName: string;
  mail: string;
  initials: string;
  avatarColor: string;
}

/**
 * Usuario con su rol dentro del proyecto activo. No se persiste: lo compone
 * useScrumBoard cruzando /users con project.members.
 */
export interface Member extends User {
  role: ProjectRole;
}
