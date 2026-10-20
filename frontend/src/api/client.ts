import axios from "axios";
import type { AxiosResponse } from "axios";
import type { User } from "../types/users";

/**
 * Cliente HTTP de Express.
 *
 * Usa /api como URL base.
 * En desarrollo, Vite redirige las solicitudes al backend.
 * MongoDB es la fuente de datos persistente.
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

export function onSessionExpired(
  callback: () => void
): () => void {
  const interceptorId = http.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      if (axios.isAxiosError(error)) {
        const url = error.config?.url;

        // Credenciales incorrectas no equivalen a una sesión vencida.
        const isPublicAuthRequest =
          url === "/auth/login" ||
          url === "/auth/register";

        if (
          error.response?.status === 401 &&
          !isPublicAuthRequest
        ) {
          clearStoredSession();
          callback();
        }
      }

      return Promise.reject(error);
    }
  );

  return () => {
    http.interceptors.response.eject(interceptorId);
  };
}

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
  try {
    await http.post("/auth/logout");
  } catch (error: unknown) {
    const sessionAlreadyInvalid =
      axios.isAxiosError(error) &&
      error.response?.status === 401;

    // Si la sesión ya venció, igualmente podemos salir localmente.
    // Un fallo de red u otro error sí debe informarse.
    if (!sessionAlreadyInvalid) {
      throw error;
    }
  }
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
      const body: unknown = error.response.data;
      if (
        typeof body === "object" &&
        body !== null &&
        "error" in body &&
        typeof body.error === "string" &&
        body.error
      ) {
        return body.error;
      }
      return `El servidor respondió ${error.response.status}.`;
    }
    return "No se pudo contactar con el backend. Revisa que Express esté funcionando.";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Ocurrió un error inesperado.";
}
