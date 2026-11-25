import { expect, test } from '@playwright/test';
import {
  createProjectViaUi,
  loginAndGoTo,
  loginWith,
  registerInvitedUser,
  registerTestUser,
  resetTestDb,
} from './helper';

test.describe('scrum: permisos de Admin y Miembro', () => {
  test.beforeEach(async ({ request }) => {
    await resetTestDb(request);
  });

  test('invita a un miembro y restringe su vista de administracion', async ({
    page,
    request,
  }) => {
    const admin = await registerTestUser(request);
    const invited = await registerInvitedUser(request);

    await loginAndGoTo(page, admin, '/scrum');
    await createProjectViaUi(page, 'Equipo E2E');

    await page.getByRole('button', { name: 'Invitar al equipo' }).click();
    const invite = page.getByRole('dialog', { name: 'Invitar al equipo' });
    await invite.getByLabel('Buscar por nombre o usuario').fill('e2e.invited');
    await invite.getByText('@e2e.invited').hover();
    await invite.getByRole('button', { name: 'Añadir' }).click();
    await expect(invite).not.toBeVisible();

    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await loginWith(page, invited.username, invited.password);
    await expect(page).toHaveURL(/\/scrum/);

    await expect(
      page.getByRole('heading', { name: 'Equipo E2E' })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Invitar al equipo' })
    ).not.toBeVisible();

    await page.getByRole('button', { name: 'Ajustes del proyecto' }).click();
    const settings = page.getByRole('dialog', { name: 'Ajustes del Proyecto' });
    await expect(
      settings.getByRole('tab', { name: 'Zona de Peligro' })
    ).not.toBeVisible();
    await expect(
      settings.getByRole('combobox', { name: /Rol de/ })
    ).toHaveCount(0);
    await settings.getByRole('button', { name: 'Cerrar ajustes' }).click();

    await page.getByRole('button', { name: '+ Añadir tarea' }).click();
    await expect(
      page.getByRole('option', { name: '+ Nuevo Sprint...' })
    ).toHaveCount(0);
    await expect(
      page.getByRole('option', { name: '+ Nueva categoría...' })
    ).toHaveCount(0);
  });

  test('el admin cambia el rol de un miembro y protege al unico admin', async ({
    page,
    request,
  }) => {
    const admin = await registerTestUser(request);
    await registerInvitedUser(request);

    await loginAndGoTo(page, admin, '/scrum');
    await createProjectViaUi(page, 'Roles E2E');

    await page.getByRole('button', { name: 'Invitar al equipo' }).click();
    const invite = page.getByRole('dialog', { name: 'Invitar al equipo' });
    await invite.getByLabel('Buscar por nombre o usuario').fill('Invitada');
    await invite.getByText('@e2e.invited').hover();
    await invite.getByRole('button', { name: 'Añadir' }).click();
    await expect(invite).not.toBeVisible();

    await page.getByRole('button', { name: 'Ajustes del proyecto' }).click();
    const settings = page.getByRole('dialog', { name: 'Ajustes del Proyecto' });

    const ownRole = settings.getByRole('combobox', { name: 'Rol de Prueba E2E' });
    await expect(ownRole).toBeDisabled();

    const invitedRole = settings.getByRole('combobox', {
      name: 'Rol de Invitada E2E',
    });
    await expect(invitedRole).toHaveValue('Miembro');
    await invitedRole.selectOption('Admin');
    await expect(invitedRole).toHaveValue('Admin');
    await expect(ownRole).toBeEnabled();
  });
});