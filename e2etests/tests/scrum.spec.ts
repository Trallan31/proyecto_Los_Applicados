import { expect, test } from '@playwright/test';
import {
  addScrumTaskViaUi,
  createProjectViaUi,
  loginAndGoTo,
  registerTestUser,
  resetTestDb,
} from './helper';

test.describe('scrum: proyectos y tablero', () => {
  test.beforeEach(async ({ request }) => {
    await resetTestDb(request);
  });

  test('crea un proyecto y una tarea con sprint, categoria y horas', async ({
    page,
    request,
  }) => {
    const user = await registerTestUser(request);
    await loginAndGoTo(page, user, '/scrum');

    await expect(
      page.getByText('No hay proyectos actualmente.')
    ).toBeVisible();
    await createProjectViaUi(page, 'Proyecto E2E');
    await expect(page).toHaveURL(/\?project=/);

    await addScrumTaskViaUi(page, 'Implementar login', {
      sprint: 'Sprint E2E',
      category: 'Desarrollo',
      hours: '5',
      dueDate: '2026-12-31',
    });

    const row = page.locator('tr[data-task-id]');
    await expect(row).toContainText('Implementar login');
    await expect(row).toContainText('Sprint E2E');
    await expect(row).toContainText('Desarrollo');
    await expect(row).toContainText('5h');
  });

  test('edita el titulo y el estado de una tarea en linea', async ({
    page,
    request,
  }) => {
    const user = await registerTestUser(request);
    await loginAndGoTo(page, user, '/scrum');
    await createProjectViaUi(page, 'Edicion E2E');
    await addScrumTaskViaUi(page, 'Tarea original');

    await page
      .getByRole('gridcell', { name: 'Editar título de la tarea Tarea original' })
      .dblclick();
    await page.getByLabel('Editar texto').fill('Tarea editada');
    await page.getByLabel('Editar texto').press('Enter');
    await expect(page.getByText('Tarea editada', { exact: true })).toBeVisible();
    await expect(
      page.getByText('Tarea original', { exact: true })
    ).not.toBeVisible();

    const statusCell = page.getByRole('gridcell', {
      name: 'Editar estado de la tarea Tarea editada',
    });
    await statusCell.click();
    await statusCell.getByRole('combobox').selectOption('Completada');

    await expect(page.getByText('100%')).toBeVisible();
  });

  test('reordena tareas con el teclado y persiste el orden', async ({
    page,
    request,
  }) => {
    const user = await registerTestUser(request);
    await loginAndGoTo(page, user, '/scrum');
    await createProjectViaUi(page, 'Orden E2E');
    await addScrumTaskViaUi(page, 'Primera');
    await addScrumTaskViaUi(page, 'Segunda');

    const rows = page.locator('tr[data-task-id]');
    await expect(rows.nth(0)).toContainText('Primera');
    await expect(rows.nth(1)).toContainText('Segunda');

    await page
      .getByRole('button', { name: /Reordenar la tarea Segunda/ })
      .focus();
    await page.keyboard.press('ArrowUp');

    await expect(rows.nth(0)).toContainText('Segunda');
    await expect(rows.nth(1)).toContainText('Primera');

    await page.reload();
    await expect(rows.nth(0)).toContainText('Segunda');
    await expect(rows.nth(1)).toContainText('Primera');
  });

  test('elimina una tarea pidiendo confirmacion', async ({ page, request }) => {
    const user = await registerTestUser(request);
    await loginAndGoTo(page, user, '/scrum');
    await createProjectViaUi(page, 'Borrado E2E');
    await addScrumTaskViaUi(page, 'Tarea descartable');

    await page.locator('tr[data-task-id]').hover();
    await page.getByRole('button', { name: 'Eliminar tarea' }).click();
    const confirm = page.getByRole('dialog', { name: 'Eliminar tarea' });
    await expect(confirm).toBeVisible();

    await confirm.getByRole('button', { name: 'Cancelar' }).click();
    await expect(confirm).not.toBeVisible();
    await expect(
      page.getByText('Tarea descartable', { exact: true })
    ).toBeVisible();

    await page.locator('tr[data-task-id]').hover();
    await page.getByRole('button', { name: 'Eliminar tarea' }).click();
    await page
      .getByRole('dialog', { name: 'Eliminar tarea' })
      .getByRole('button', { name: 'Sí, eliminar' })
      .click();

    await expect(
      page.getByText('Tarea descartable', { exact: true })
    ).not.toBeVisible();
  });

  test('sincroniza el proyecto activo con la URL', async ({ page, request }) => {
    const user = await registerTestUser(request);
    await loginAndGoTo(page, user, '/scrum');
    await createProjectViaUi(page, 'Alpha');
    await createProjectViaUi(page, 'Beta');

    const betaId = new URL(page.url()).searchParams.get('project') ?? '';
    expect(betaId).not.toBe('');

    await page.getByRole('button', { name: 'Alpha' }).click();
    await expect(page.getByRole('heading', { name: 'Alpha' })).toBeVisible();
    await expect(page).not.toHaveURL(new RegExp(betaId));

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Alpha' })).toBeVisible();

    await page.goto(`/scrum?project=${betaId}`);
    await expect(page.getByRole('heading', { name: 'Beta' })).toBeVisible();
  });

  test('abre las estadisticas del proyecto y cierra con Escape', async ({
    page,
    request,
  }) => {
    const user = await registerTestUser(request);
    await loginAndGoTo(page, user, '/scrum');
    await createProjectViaUi(page, 'Stats E2E');
    await addScrumTaskViaUi(page, 'Tarea con horas', { hours: '8' });

    await page.getByRole('button', { name: 'Estadísticas' }).click();
    const stats = page.getByRole('dialog', {
      name: 'Estadísticas del Proyecto',
    });
    await expect(stats).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(stats).not.toBeVisible();
  });

  test('elimina el proyecto desde la zona de peligro', async ({
    page,
    request,
  }) => {
    const user = await registerTestUser(request);
    await loginAndGoTo(page, user, '/scrum');
    await createProjectViaUi(page, 'Proyecto temporal');

    await page.getByRole('button', { name: 'Ajustes del proyecto' }).click();
    const settings = page.getByRole('dialog', { name: 'Ajustes del Proyecto' });
    await settings.getByRole('tab', { name: 'Zona de Peligro' }).click();
    await settings
      .getByRole('button', { name: 'Eliminar Proyecto Definitivamente' })
      .click();

    await page
      .getByRole('dialog', { name: 'Eliminar proyecto' })
      .getByRole('button', { name: 'Sí, eliminar' })
      .click();

    await expect(
      page.getByText('No hay proyectos actualmente.')
    ).toBeVisible();
  });
});