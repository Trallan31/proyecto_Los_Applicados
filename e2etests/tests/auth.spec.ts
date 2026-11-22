import { expect, test } from '@playwright/test';
import { loginWith, registerTestUser, resetTestDb } from './helper';

test.describe('autenticacion y acceso restringido', () => {
  test.beforeEach(async ({ request }) => {
    await resetTestDb(request);
  });

  test('redirige una ruta protegida al login', async ({ page }) => {
    await page.goto('/organizador');

    await expect(page).toHaveURL(/\/login\?next=%2Forganizador/);
    await expect(
      page.getByRole('heading', { name: 'Iniciar sesión' })
    ).toBeVisible();
  });

  test('conserva /scrum como destino despues del login', async ({
    page,
    request,
  }) => {
    const user = await registerTestUser(request);

    await page.goto('/scrum');
    await expect(page).toHaveURL(/\/login\?next=%2Fscrum/);
    await loginWith(page, user.username, user.password);

    await expect(page).toHaveURL(/\/scrum$/);
    await expect(
      page.getByRole('navigation', { name: 'Navegación principal' })
    ).toBeVisible();
  });

  test('muestra un error con credenciales invalidas', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Usuario o correo').fill('usuario-invalido');
    await page.getByLabel('Contraseña').fill('contraseña-invalida');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('alert')).toHaveText(
      'Usuario o contraseña incorrectos.'
    );
  });
});
