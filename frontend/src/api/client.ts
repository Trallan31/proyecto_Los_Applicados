import axios from "axios";

/**
 * Cliente HTTP unico de la aplicacion.
 *
 * Todas las rutas cuelgan de /api. En desarrollo Vite redirige /api al
 * json-server del puerto 3001 (ver vite.config.ts). El dia que el backend
 * pase a Express + Mongoose basta con montarlo en /api y este archivo no
 * cambia: las rutas y los verbos son los mismos.
 */
const http = axios.create({ baseURL: "/api" });

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
    if (error.response) return `El servidor respondio ${error.response.status}.`;
    return "No se pudo contactar la API. Revisa que json-server este corriendo en el puerto 3001.";
  }
  return "Ocurrio un error inesperado.";
}
