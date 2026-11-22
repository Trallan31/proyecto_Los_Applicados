import type { APIRequestContext, Page } from '@playwright/test';

export interface TestUser {
  username: string;
  password: string;
}

export async function resetTestDb(
  request: APIRequestContext
): Promise<void> {
  const response = await request.post('/api/testing/reset');
  if (!response.ok()) {
    throw new Error(
      `No se pudo reiniciar la base de pruebas: HTTP ${response.status()}`
    );
  }
}

export async function registerTestUser(
  request: APIRequestContext
): Promise<TestUser> {
  const user: TestUser = {
    username: 'e2e.user',
    password: 'ClaveSegura123',
  };

  const response = await request.post('/api/auth/register', {
    data: {
      username: user.username,
      name: 'Prueba',
      lastName: 'E2E',
      mail: 'e2e@ejemplo.com',
      password: user.password,
    },
  });

  if (!response.ok()) {
    throw new Error(
      `No se pudo registrar el usuario E2E: HTTP ${response.status()}`
    );
  }

  return user;
}

export async function loginWith(
  page: Page,
  username: string,
  password: string
): Promise<void> {
  await page.getByLabel('Usuario o correo').fill(username);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
}
