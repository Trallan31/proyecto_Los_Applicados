import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RegisterPage from "./RegisterPage";
import type { User } from "../types/users";

const registerMock = vi.fn();
const describeErrorMock = vi.fn();
let mockUser: User | null = null;

vi.mock("../store/useAuthStore", () => ({
  useAuthStore: (
    selector: (state: {
      user: User | null;
      register: typeof registerMock;
    }) => unknown
  ) =>
    selector({
      user: mockUser,
      register: registerMock,
    }),
}));

vi.mock("../api/client", () => ({
  describeError: (...args: unknown[]) => describeErrorMock(...args),
}));

function renderRegisterPage(route = "/registro") {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/organizador" element={<div>Vista Organizador</div>} />
        <Route path="/scrum" element={<div>Vista Scrum</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("RegisterPage", () => {
  beforeEach(() => {
    mockUser = null;
    registerMock.mockReset();
    describeErrorMock.mockReset();
    describeErrorMock.mockReturnValue("No se pudo registrar la cuenta.");
  });

  it("renderiza los campos accesibles y el enlace 'Inicia sesión' con ?next= sanitizado", () => {
    const { unmount } = renderRegisterPage("/registro");

    expect(
      screen.getByRole("heading", { name: "Crear cuenta" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre")).toBeInTheDocument();
    expect(screen.getByLabelText("Apellido")).toBeInTheDocument();
    expect(screen.getByLabelText("Usuario")).toBeInTheDocument();
    expect(screen.getByLabelText("Correo")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    expect(screen.getByLabelText("Repetir contraseña")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Crear cuenta" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Inicia sesión" })
    ).toHaveAttribute("href", "/login");
    unmount();

    renderRegisterPage("/registro?next=%2Fscrum%3Fproject%3Dp2");
    expect(
      screen.getByRole("link", { name: "Inicia sesión" })
    ).toHaveAttribute("href", "/login?next=%2Fscrum%3Fproject%3Dp2");
  });

  it("sanitiza el parámetro ?next= inválido en el enlace 'Inicia sesión'", () => {
    renderRegisterPage("/registro?next=https%3A%2F%2Fevil.com");

    expect(
      screen.getByRole("link", { name: "Inicia sesión" })
    ).toHaveAttribute("href", "/login?next=%2Forganizador");
  });

  it("valida campos requeridos con solo espacios sin llamar a register", async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    await user.type(screen.getByLabelText("Nombre"), "   ");
    await user.type(screen.getByLabelText("Apellido"), "González");
    await user.type(screen.getByLabelText("Usuario"), "mgonzalez");
    await user.type(screen.getByLabelText("Correo"), "mgonzalez@uc.cl");
    await user.type(screen.getByLabelText("Contraseña"), "ClaveSegura1");
    await user.type(screen.getByLabelText("Repetir contraseña"), "ClaveSegura1");
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Completa todos los campos requeridos sin dejar solo espacios."
    );
    expect(registerMock).not.toHaveBeenCalled();
  });

  it("valida que las contraseñas coincidan antes de enviar", async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    await user.type(screen.getByLabelText("Nombre"), "Matías");
    await user.type(screen.getByLabelText("Apellido"), "González");
    await user.type(screen.getByLabelText("Usuario"), "mgonzalez");
    await user.type(screen.getByLabelText("Correo"), "mgonzalez@uc.cl");
    await user.type(screen.getByLabelText("Contraseña"), "ClaveSegura1");
    await user.type(screen.getByLabelText("Repetir contraseña"), "OtraClave99");
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Las contraseñas no coinciden."
    );
    expect(registerMock).not.toHaveBeenCalled();
  });

  it("valida longitud mínima de 8 caracteres para la contraseña", async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    await user.type(screen.getByLabelText("Nombre"), "Matías");
    await user.type(screen.getByLabelText("Apellido"), "González");
    await user.type(screen.getByLabelText("Usuario"), "mgonzalez");
    await user.type(screen.getByLabelText("Correo"), "mgonzalez@uc.cl");
    await user.type(screen.getByLabelText("Contraseña"), "1234567");
    await user.type(screen.getByLabelText("Repetir contraseña"), "1234567");

    const form = screen
      .getByRole("button", { name: "Crear cuenta" })
      .closest("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "La contraseña debe tener al menos 8 caracteres."
    );
    expect(registerMock).not.toHaveBeenCalled();
  });

  it("envía el formulario trimeando datos personales sin trimear la contraseña", async () => {
    const user = userEvent.setup();
    registerMock.mockResolvedValue(undefined);
    renderRegisterPage();

    await user.type(screen.getByLabelText("Nombre"), "  Matías  ");
    await user.type(screen.getByLabelText("Apellido"), "  González  ");
    await user.type(screen.getByLabelText("Usuario"), "  mgonzalez  ");
    await user.type(screen.getByLabelText("Correo"), "  mgonzalez@uc.cl  ");
    await user.type(screen.getByLabelText("Contraseña"), "  ClaveSegura1  ");
    await user.type(
      screen.getByLabelText("Repetir contraseña"),
      "  ClaveSegura1  "
    );
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith({
        name: "Matías",
        lastName: "González",
        username: "mgonzalez",
        mail: "mgonzalez@uc.cl",
        password: "  ClaveSegura1  ",
      });
    });
  });

  it("muestra estado 'Creando cuenta...' deshabilitado mientras el registro está pendiente", async () => {
    const user = userEvent.setup();
    let resolverRegistro: (() => void) | undefined;
    registerMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolverRegistro = resolve;
        })
    );
    renderRegisterPage();

    await user.type(screen.getByLabelText("Nombre"), "Matías");
    await user.type(screen.getByLabelText("Apellido"), "González");
    await user.type(screen.getByLabelText("Usuario"), "mgonzalez");
    await user.type(screen.getByLabelText("Correo"), "mgonzalez@uc.cl");
    await user.type(screen.getByLabelText("Contraseña"), "ClaveSegura1");
    await user.type(screen.getByLabelText("Repetir contraseña"), "ClaveSegura1");
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    const submitButton = screen.getByRole("button", {
      name: "Creando cuenta...",
    });
    expect(submitButton).toBeDisabled();

    resolverRegistro?.();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Crear cuenta" })
      ).toBeEnabled();
    });
  });

  it("muestra el error devuelto por describeError en role='alert' si register falla", async () => {
    const user = userEvent.setup();
    const errorServicio = new Error("correo duplicado");
    registerMock.mockRejectedValue(errorServicio);
    describeErrorMock.mockReturnValue("El correo ya está en uso.");
    renderRegisterPage();

    await user.type(screen.getByLabelText("Nombre"), "Matías");
    await user.type(screen.getByLabelText("Apellido"), "González");
    await user.type(screen.getByLabelText("Usuario"), "mgonzalez");
    await user.type(screen.getByLabelText("Correo"), "mgonzalez@uc.cl");
    await user.type(screen.getByLabelText("Contraseña"), "ClaveSegura1");
    await user.type(screen.getByLabelText("Repetir contraseña"), "ClaveSegura1");
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El correo ya está en uso."
    );
    expect(describeErrorMock).toHaveBeenCalledWith(errorServicio);
  });

  it("redirige a /organizador o al ?next= válido si el usuario ya está autenticado", () => {
    mockUser = {
      id: "u1",
      username: "mgonzalez",
      name: "Matías",
      lastName: "González",
      mail: "mgonzalez@uc.cl",
      initials: "MG",
      avatarColor: "#4f7cff",
    };

    const { unmount } = renderRegisterPage("/registro");
    expect(screen.getByText("Vista Organizador")).toBeInTheDocument();
    unmount();

    const segundaRender = renderRegisterPage("/registro?next=%2Fscrum%3Fproject%3Dp1");
    expect(screen.getByText("Vista Scrum")).toBeInTheDocument();
    segundaRender.unmount();

    renderRegisterPage("/registro?next=https%3A%2F%2Fevil.com");
    expect(screen.getByText("Vista Organizador")).toBeInTheDocument();
  });
});
