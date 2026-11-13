import type { ProjectRole } from "./projects";

/**
 * Recurso /users.
 * `mail` es opcional porque solo viene incluido en las respuestas de autenticación
 * (/api/auth/me, /api/auth/login, /api/auth/register) y se omite por privacidad
 * en el listado público de usuarios (GET /api/users).
 */
export interface User {
  id: string;
  username: string;
  name: string;
  lastName: string;
  mail?: string;
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
