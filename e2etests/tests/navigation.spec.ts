import { expect, test } from '@playwright/test';
import { loginAndGoTo, registerTestUser, resetTestDb } from './helper';

test.describe('navegacion y preferencias', () => {
  test.beforeEach(async ({ request }) => {
    await resetTestDb(request);
  });

  test('muestra 404 en una ruta inexistente y permite volver', async ({
    page,
  }) => {
    await page.goto('/ruta-que-no-existe');
    await expect(
      page.getByRole('heading', { name: 'Página no encontrada' })
    ).toBeVisible();
    await expect(page.getByText('404')).toBeVisible();

    await page.getByRole('link', { name: 'Ir al inicio' }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('la raiz redirige al organizador con sesion iniciada', async ({
    page,
    request,
  }) => {
    const user = await registerTestUser(request);
    await loginAndGoTo(page, user, '/organizador');

    await page.goto('/');
    await expect(page).toHaveURL(/\/organizador$/);
  });

  test('cambia el tema y lo persiste al recargar', async ({ page, request }) => {
    const user = await registerTestUser(request);
    await loginAndGoTo(page, user, '/organizador');

    const html = page.locator('html');
    const wasDark = await html.evaluate((el) => el.classList.contains('dark'));

    await page.getByRole('button', { name: 'Cambiar tema' }).click();
    if (wasDark) {
      await expect(html).not.toHaveClass(/dark/);
    } else {
      await expect(html).toHaveClass(/dark/);
    }

    await page.reload();
    if (wasDark) {
      await expect(html).not.toHaveClass(/dark/);
    } else {
      await expect(html).toHaveClass(/dark/);
    }
  });
});