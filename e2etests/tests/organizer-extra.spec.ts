import { expect, test } from '@playwright/test';
import {
  createCourseViaUi,
  createOrganizerActivityViaUi,
  loginAndGoTo,
  registerTestUser,
  resetTestDb,
} from './helper';

test.describe('organizador: horarios, enlaces y estados', () => {
  test.beforeEach(async ({ request }) => {
    await resetTestDb(request);
  });

  test('agrega y elimina un horario de clase', async ({ page, request }) => {
    const user = await registerTestUser(request);
    await loginAndGoTo(page, user, '/organizador');

    await page
      .getByRole('button', { name: 'Gestionar ramos y horarios' })
      .click();
    await page.getByPlaceholder('Nombre ramo...').fill('Sistemas Operativos');
    await page.getByPlaceholder('Código (ej: IIC2143)...').fill('CC4302-1');
    await page.getByRole('button', { name: '+ Ramo' }).click();
    await expect(
      page.getByText('Sistemas Operativos', { exact: true }).first()
    ).toBeVisible();

    await page.locator('#sess-type').selectOption('Cátedra');
    await page.locator('#sess-day').selectOption({ label: 'Lunes' });
    await page.locator('#sess-hour').selectOption({ label: '8:00' });
    await page.locator('#sess-duration').selectOption({ label: '2 horas' });
    await page.getByRole('button', { name: /Agregar Horario a/ }).click();

    await expect(page.getByText('8:00 - 10:00 (Cátedra)')).toBeVisible();

    await page
      .getByRole('button', { name: 'Eliminar horario de Lunes 8:00' })
      .click();
    await page
      .getByRole('dialog', { name: 'Eliminar horario' })
      .getByRole('button', { name: 'Sí, eliminar' })
      .click();
    await expect(
      page.getByText('Sin horarios registrados para este ramo.')
    ).toBeVisible();

    await page.getByRole('button', { name: 'Listo' }).click();
  });

  test('agrega un enlace util al ramo', async ({ page, request }) => {
    const user = await registerTestUser(request);
    await loginAndGoTo(page, user, '/organizador');
    await createCourseViaUi(page, 'Bases de Datos', 'CC4201-1');

    await page.getByTitle('Bases de Datos (CC4201-1)').click();
    await page
      .getByRole('button', { name: /Agregar enlaces útiles del ramo/ })
      .click();

    const dialog = page.getByRole('dialog', { name: 'Nuevo Enlace del Ramo' });
    await dialog.locator('#course-link-title').fill('U-Cursos');
    await dialog.locator('#course-link-url').fill('u-cursos.cl/curso');
    await dialog.getByRole('button', { name: 'Guardar enlace' }).click();

    const link = page.getByRole('link', { name: 'U-Cursos' });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', 'https://u-cursos.cl/curso');
  });

  test('completa una actividad y deshace desde la notificacion', async ({
    page,
    request,
  }) => {
    const user = await registerTestUser(request);
    await loginAndGoTo(page, user, '/organizador');
    await createCourseViaUi(page, 'Algoritmos', 'CC3101-1');
    await page.getByTitle('Algoritmos (CC3101-1)').click();
    await createOrganizerActivityViaUi(
      page,
      'Estudiar grafos',
      'Algoritmos (CC3101-1)'
    );

    await page.getByRole('button', { name: 'Marcar como completada' }).click();

    const toast = page
      .getByRole('status')
      .filter({ hasText: 'marcada como lista' });
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('"Estudiar grafos" marcada como lista');

    await toast.getByRole('button', { name: 'Deshacer' }).click();
    await expect(toast).not.toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Marcar como completada' })
    ).toBeVisible();
  });

  test('filtra actividades por estado', async ({ page, request }) => {
    const user = await registerTestUser(request);
    await loginAndGoTo(page, user, '/organizador');
    await createCourseViaUi(page, 'Redes', 'CC4303-1');
    await page.getByTitle('Redes (CC4303-1)').click();
    await createOrganizerActivityViaUi(page, 'Leer paper', 'Redes (CC4303-1)');

    await page.getByRole('button', { name: 'Marcar como completada' }).click();
    await expect(
      page.getByRole('button', { name: 'Marcar como pendiente' })
    ).toBeVisible();

    const statusFilter = page.locator('select').filter({ hasText: 'Estado:' });
    await statusFilter.selectOption('Pendiente');
    await expect(
      page.getByText('No hay actividades para mostrar')
    ).toBeVisible();

    await statusFilter.selectOption('Completada');
    await expect(page.getByText('Leer paper', { exact: true })).toBeVisible();
  });
});