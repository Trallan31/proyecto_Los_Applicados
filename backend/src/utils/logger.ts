import { isTestEnv } from "./config";

function info(...params: unknown[]): void {
  if (!isTestEnv()) {
    console.log(...params);
  }
}

function error(...params: unknown[]): void {
  if (!isTestEnv()) {
    console.error(...params);
  }
}

/** Logger de la aplicación silenciado automáticamente en entorno de pruebas. */
export const logger = {
  info,
  error,
};
