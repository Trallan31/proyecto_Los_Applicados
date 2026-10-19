import axios from "axios";
import type { AxiosResponse } from "axios";
import type { User } from "../types/users";

/**
 * Cliente HTTP unico de la aplicacion.
 *
 * Todas las rutas cuelgan de /api. En desarrollo Vite redirige /api al
 * json-server del puerto 3001 (ver vite.config.ts). El dia que el backend
 * pase a Express + Mongoose basta con montarlo en /api y este archivo no
 * cambia: las rutas y los verbos son los mismos.
 */
const http = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

http.interceptors.request.use((config) => {
  const csrfToken = localStorage.getItem("csrfToken");
  if (csrfToken) {
    config.headers.set("X-CSRF-Token", csrfToken);
  }
  return config;
});

export interface RegisterData {
  username: string;
  name: string;
  lastName: string;
  mail: string;
  password: string;
}

export async function login(username: string, password: string) {
  return storeSession(
    await http.post<User>("/auth/login", { username, password })
  );
}

export async function register(data: RegisterData) {
  return storeSession(await http.post<User>("/auth/register", data));
}

/** Guarda el token CSRF y el usuario que devuelve /auth/login o /auth/register. */
function storeSession({
  data,
  headers,
}: AxiosResponse<User>): User {
  const csrfToken = headers["x-csrf-token"];
  if (typeof csrfToken !== "string") {
    throw new Error("El servidor no entregó un token CSRF.");
  }
  localStorage.setItem("csrfToken", csrfToken);
  localStorage.setItem("auth_user", JSON.stringify(data));
  return data;
}

export async function restoreSession(): Promise<User | null> {
  try {
    const { data } = await http.get<User>("/auth/me");
    localStorage.setItem("auth_user", JSON.stringify(data));
    return data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearStoredSession();
      return null;
    }
    throw error;
  }
}

export async function logout(): Promise<void> {
  await http.post("/auth/logout");
  clearStoredSession();
}

function clearStoredSession(): void {
  localStorage.removeItem("csrfToken");
  localStorage.removeItem("auth_user");
}

/** GET /<recurso> */
export async function list<T>(resource: string): Promise<T[]> {
  const { data } = await http.get<T[]>(`/${resource}`);
  return data;
}

/** POST /<recurso>. El id lo genera el servidor, no el cliente. */
export async function create<T>(resource: string, body: unknown): Promise<T> {
  const { data } = await http.post<T>(`/${resource}`, body);
  return data;
}

/** PATCH /<recurso>/<id>. Envia solo los campos que cambian. */
export async function update<T>(resource: string, id: string, changes: unknown): Promise<T> {
  const { data } = await http.patch<T>(`/${resource}/${id}`, changes);
  return data;
}

/** DELETE /<recurso>/<id> */
export async function remove(resource: string, id: string): Promise<void> {
  await http.delete(`/${resource}/${id}`);
}

/** Mensaje legible para mostrar en pantalla cuando la API falla. */
export function describeError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      // El backend responde { error: "<mensaje>" } en los casos previstos.
      const message = (error.response.data as { error?: unknown } | undefined)
        ?.error;
      if (typeof message === "string" && message) return message;
      return `El servidor respondio ${error.response.status}.`;
    }
    return "No se pudo contactar la API. Revisa que json-server este corriendo en el puerto 3001.";
  }
  return "Ocurrio un error inesperado.";
}
