import "dotenv/config";

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Falta ${name} en el archivo .env.`);
  }
  return value;
}

export const port = Number(process.env.PORT ?? 3001);
export const jwtSecret = requiredEnvironment("JWT_SECRET");

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT debe ser un puerto válido.");
}

export function getJwtSecret(): string {
  return jwtSecret;
}
