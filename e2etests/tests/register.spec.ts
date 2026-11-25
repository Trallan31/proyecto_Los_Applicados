import { expect, test } from '@playwright/test';
import { loginWith, registerTestUser, resetTestDb } from './helper';

test.describe('registro de usuarios', () => {
  test.beforeEach(async ({ request }) => {
    await resetTestDb(request);
  });

  test('crea una cuenta desde la interfaz y permite entrar con ella', async ({
    page,
  }) => {
    await page.goto('/registro');
    await page.getByLabel('Nombre').fill('Nueva');
    await page.getByLabel('Apellido').fill('Persona');
    await page.getByLabel('Usuario').fill('e2e.nueva');
    await page.getByLabel('Correo').fill('nueva@ejemplo.com');
    await page.getByLabel('Contraseña', { exact: true }).fill('ClaveSegura123');
    await page.getByLabel('Repetir contraseña').fill('ClaveSegura123');
    await page.getByRole('button', { name: 'Crear cuenta' }).click();

    await expect(page).toHaveURL(/\/organizador$/);

    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await loginWith(page, 'e2e.nueva', 'ClaveSegura123');
    await expect(page).toHaveURL(/\/organizador$/);
  });

  test('rechaza contraseñas que no coinciden', async ({ page }) => {
    await page.goto('/registro');
    await page.getByLabel('Nombre').fill('Nueva');
    await page.getByLabel('Apellido').fill('Persona');
    await page.getByLabel('Usuario').fill('e2e.nueva');
    await page.getByLabel('Correo').fill('nueva@ejemplo.com');
    await page.getByLabel('Contraseña', { exact: true }).fill('ClaveSegura123');
    await page.getByLabel('Repetir contraseña').fill('OtraClave123');
    await page.getByRole('button', { name: 'Crear cuenta' }).click();

    await expect(page.getByRole('alert')).toHaveText(
      'Las contraseñas no coinciden.'
    );
    await expect(page).toHaveURL(/\/registro$/);
  });

  test('rechaza un nombre de usuario ya registrado', async ({
    page,
    request,
  }) => {
    await registerTestUser(request);

    await page.goto('/registro');
    await page.getByLabel('Nombre').fill('Otra');
    await page.getByLabel('Apellido').fill('Persona');
    await page.getByLabel('Usuario').fill('e2e.user');
    await page.getByLabel('Correo').fill('otra@ejemplo.com');
    await page.getByLabel('Contraseña', { exact: true }).fill('ClaveSegura123');
    await page.getByLabel('Repetir contraseña').fill('ClaveSegura123');
    await page.getByRole('button', { name: 'Crear cuenta' }).click();

    await expect(page.getByRole('alert')).toHaveText(
      'Ese usuario ya está registrado.'
    );
  });

  test('navega de login a registro conservando el destino', async ({ page }) => {
    await page.goto('/scrum');
    await expect(page).toHaveURL(/\/login\?next=%2Fscrum/);

    await page.getByRole('link', { name: 'Crear una' }).click();
    await expect(page).toHaveURL(/\/registro\?next=%2Fscrum/);

    await page.getByLabel('Nombre').fill('Destino');
    await page.getByLabel('Apellido').fill('E2E');
    await page.getByLabel('Usuario').fill('e2e.destino');
    await page.getByLabel('Correo').fill('destino@ejemplo.com');
    await page.getByLabel('Contraseña', { exact: true }).fill('ClaveSegura123');
    await page.getByLabel('Repetir contraseña').fill('ClaveSegura123');
    await page.getByRole('button', { name: 'Crear cuenta' }).click();

    await expect(page).toHaveURL(/\/scrum$/);
  });
});