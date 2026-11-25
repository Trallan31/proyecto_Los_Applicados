import { expect, type APIRequestContext, type Page } from '@playwright/test';

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
      `No se pudo reiniciar la base de pruebas: HTTP ${response.status}`
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
      `No se pudo registrar el usuario E2E: HTTP ${response.status}`
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

export async function registerInvitedUser(
  request: APIRequestContext
): Promise<TestUser> {
  const user: TestUser = {
    username: 'e2e.invited',
    password: 'ClaveSegura123',
  };

  const response = await request.post('/api/auth/register', {
    data: {
      username: user.username,
      name: 'Invitada',
      lastName: 'E2E',
      mail: 'e2e.invitada@ejemplo.com',
      password: user.password,
    },
  });

  if (!response.ok()) {
    throw new Error(
      `No se pudo registrar el usuario invitado: HTTP ${response.status}`
    );
  }

  return user;
}

export async function loginAndGoTo(
  page: Page,
  user: TestUser,
  path: string
): Promise<void> {
  await page.goto(path);
  await loginWith(page, user.username, user.password);
  await expect(
    page.getByRole('navigation', { name: 'Navegación principal' })
  ).toBeVisible();
}

export async function createProjectViaUi(
  page: Page,
  name: string
): Promise<void> {
  await expect(
    page
      .getByText('No hay proyectos actualmente.')
      .or(page.getByRole('button', { name: '+ Proyecto' }))
  ).toBeVisible();

  const emptyStateButton = page.getByRole('button', {
    name: '+ Crear Proyecto',
    exact: true,
  });
  if (await emptyStateButton.isVisible()) {
    await emptyStateButton.click();
  } else {
    await page.getByRole('button', { name: '+ Proyecto' }).click();
  }

  const dialog = page.getByRole('dialog', { name: 'Nuevo Proyecto' });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Nombre').fill(name);
  await dialog
    .getByRole('button', { name: 'Crear Proyecto', exact: true })
    .click();

  await expect(page.getByRole('heading', { name })).toBeVisible();
}

export async function addScrumTaskViaUi(
  page: Page,
  title: string,
  options: {
    sprint?: string;
    category?: string;
    hours?: string;
    dueDate?: string;
  } = {}
): Promise<void> {
  await page.getByRole('button', { name: '+ Añadir tarea' }).click();
  await page.getByLabel('Nombre de la tarea').fill(title);

  if (options.sprint) {
    const sprintInput = page.getByLabel('Nombre del nuevo sprint');
    if (!(await sprintInput.isVisible())) {
      await page.getByLabel('Sprint', { exact: true }).selectOption('__NEW__');
    }
    await sprintInput.fill(options.sprint);
  }

  if (options.category) {
    const categoryInput = page.getByLabel('Nombre de la nueva categoría');
    if (!(await categoryInput.isVisible())) {
      await page
        .getByLabel('Categoría', { exact: true })
        .selectOption('__NEW__');
    }
    await categoryInput.fill(options.category);
  }

  if (options.hours) {
    await page.getByLabel('Horas estimadas').fill(options.hours);
  }
  if (options.dueDate) {
    await page.getByLabel('Fecha límite').fill(options.dueDate);
  }

  await page.getByRole('button', { name: 'Guardar tarea' }).click();
  await expect(
    page.getByRole('gridcell', { name: `Editar título de la tarea ${title}` })
  ).toBeVisible();
}

export async function createCourseViaUi(
  page: Page,
  name: string,
  code: string
): Promise<void> {
  await page
    .getByRole('button', { name: 'Gestionar ramos y horarios' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Gestionar Ramos y Horarios de Clases' })
  ).toBeVisible();
  await page.getByPlaceholder('Nombre ramo...').fill(name);
  await page.getByPlaceholder('Código (ej: IIC2143)...').fill(code);
  await page.getByRole('button', { name: '+ Ramo' }).click();
  await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Listo' }).click();
}

export async function createOrganizerActivityViaUi(
  page: Page,
  title: string,
  courseLabel: string
): Promise<void> {
  await page.getByRole('button', { name: 'Nueva actividad' }).click();
  const dialog = page.getByRole('dialog', {
    name: 'Nueva Actividad Individual',
  });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Título').fill(title);
  await page.locator('#task-course').selectOption({ label: courseLabel });
  await page.locator('#task-type').selectOption('Tarea');
  await page.locator('#task-enddate').fill('2026-12-31');
  await dialog.getByRole('button', { name: 'Crear actividad' }).click();
  await expect(page.getByText(title, { exact: true })).toBeVisible();
}