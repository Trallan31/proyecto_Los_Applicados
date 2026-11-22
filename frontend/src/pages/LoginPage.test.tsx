import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from './LoginPage';

const loginMock = vi.fn();

vi.mock('../store/useAuthStore', () => ({
  useAuthStore: (selector: (state: {
    user: null;
    login: typeof loginMock;
  }) => unknown) =>
    selector({
      user: null,
      login: loginMock,
    }),
}));

vi.mock('../api/client', () => ({
  describeError: () => 'Usuario o contraseña incorrectos.',
}));

function renderLoginPage(route = '/login') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <LoginPage />
    </MemoryRouter>
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    loginMock.mockReset();
  });

  it('renderiza el formulario y usa accesibilidad de etiquetas', () => {
    renderLoginPage();

    expect(
      screen.getByRole('heading', { name: 'Iniciar sesión' })
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Usuario o correo')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
  });

  it('envia las credenciales al iniciar sesion', async () => {
    const user = userEvent.setup();
    loginMock.mockResolvedValue(undefined);
    renderLoginPage();

    await user.type(
      screen.getByLabelText('Usuario o correo'),
      'mgonzalez'
    );
    await user.type(
      screen.getByLabelText('Contraseña'),
      'ClaveSegura123'
    );
    await user.click(
      screen.getByRole('button', { name: 'Iniciar sesión' })
    );

    expect(loginMock).toHaveBeenCalledWith(
      'mgonzalez',
      'ClaveSegura123'
    );
  });

  it('muestra el error devuelto por el servicio', async () => {
    const user = userEvent.setup();
    loginMock.mockRejectedValue(new Error('credenciales invalidas'));
    renderLoginPage();

    await user.type(
      screen.getByLabelText('Usuario o correo'),
      'usuario-invalido'
    );
    await user.type(
      screen.getByLabelText('Contraseña'),
      'contraseña-invalida'
    );
    await user.click(
      screen.getByRole('button', { name: 'Iniciar sesión' })
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Usuario o contraseña incorrectos.'
    );
  });
});
