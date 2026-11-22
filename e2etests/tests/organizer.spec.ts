import { expect, test } from '@playwright/test';
import { loginWith, registerTestUser, resetTestDb } from './helper';

test.describe('organizador: ramo y actividad', () => {
  test.beforeEach(async ({ request }) => {
    await resetTestDb(request);
  });

  test('crea un ramo, crea una actividad y elimina la actividad', async ({
    page,
    request,
  }) => {
    const user = await registerTestUser(request);

    await page.goto('/organizador');
    await loginWith(page, user.username, user.password);

    await expect(page).toHaveURL(/\/organizador$/);

    await page
      .getByRole('button', { name: 'Gestionar ramos y horarios' })
      .click();

    const courseName = 'Aplicaciones Web Reactivas';
    const courseCode = 'CC5003-1';

    await page
      .getByPlaceholder('Nombre ramo...')
      .fill(courseName);
    await page
      .getByPlaceholder('Código (ej: IIC2143)...')
      .fill(courseCode);
    await page
      .getByRole('button', { name: '+ Ramo' })
      .click();

    await expect(
      page.getByRole('heading', { name: 'Gestionar Ramos y Horarios de Clases' })
    ).toBeVisible();
    await expect(page.getByText(courseName, { exact: true }).first())
      .toBeVisible();

    await page.getByRole('button', { name: 'Listo' }).click();

    await page
      .getByTitle(`${courseName} (${courseCode})`)
      .click();

    await expect(
      page.getByRole('heading', { name: courseName })
    ).toBeVisible();

    await page
      .getByRole('button', { name: 'Nueva actividad' })
      .click();

    const activityTitle = 'Entregar proyecto E2E';

    await expect(
      page.getByRole('dialog', { name: 'Nueva Actividad Individual' })
    ).toBeVisible();
    await page.getByLabel('Título').fill(activityTitle);
    await page.locator('#task-course').selectOption({ label: `${courseName} (${courseCode})` });
    await page.locator('#task-type').selectOption('Tarea');
    await page.locator('#task-enddate').fill('2026-12-31');

    await page
      .getByRole('button', { name: 'Crear actividad' })
      .click();

    await expect(page.getByText(activityTitle, { exact: true }))
      .toBeVisible();

    await page
      .getByRole('button', { name: 'Eliminar actividad', exact: true })
      .click();
    await page
      .getByRole('button', { name: 'Sí, eliminar' })
      .click();

    await expect(page.getByText(activityTitle, { exact: true }))
      .not.toBeVisible();
  });
});
