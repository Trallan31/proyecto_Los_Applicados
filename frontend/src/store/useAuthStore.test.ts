import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { RegisterData } from "../api/client";
import type { User } from "../types/users";

const { callbacksSesionExpirada, mockApi } = vi.hoisted(() => {
  const callbacks: Array<() => void> = [];
  return {
    callbacksSesionExpirada: callbacks,
    mockApi: {
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      restoreSession: vi.fn().mockResolvedValue(null),
      onSessionExpired: vi.fn((callback: () => void) => {
        callbacks.push(callback);
        return () => {};
      }),
    },
  };
});

vi.mock("../api/client", () => mockApi);

import { useAuthStore } from "./useAuthStore";

const usuarioPrueba: User = {
  id: "u1",
  username: "mgonzalez",
  name: "Matías",
  lastName: "González",
  mail: "matias@uc.cl",
  initials: "MG",
  avatarColor: "#4f7cff",
};

const datosRegistro: RegisterData = {
  username: "nuevo_usuario",
  name: "Lucía",
  lastName: "Rojas",
  mail: "lucia@uc.cl",
  password: "ClaveSegura123",
};

describe("useAuthStore", () => {
  beforeAll(async () => {
    // Espera a que termine el restoreSession() automático ejecutado al cargar el módulo.
    await vi.waitFor(() => {
      expect(useAuthStore.getState().loading).toBe(false);
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.restoreSession.mockResolvedValue(null);
    useAuthStore.setState({ user: null, loading: false });
  });

  describe("restoreSession", () => {
    it("asigna el usuario y deja loading en false cuando la sesión existe", async () => {
      useAuthStore.setState({ user: null, loading: true });
      mockApi.restoreSession.mockResolvedValueOnce(usuarioPrueba);

      await useAuthStore.getState().restoreSession();

      expect(mockApi.restoreSession).toHaveBeenCalledTimes(1);
      expect(useAuthStore.getState().user).toEqual(usuarioPrueba);
      expect(useAuthStore.getState().loading).toBe(false);
    });

    it("asigna user en null y loading en false cuando el servidor responde sin sesión", async () => {
      useAuthStore.setState({ user: usuarioPrueba, loading: true });
      mockApi.restoreSession.mockResolvedValueOnce(null);

      await useAuthStore.getState().restoreSession();

      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().loading).toBe(false);
    });

    it("limpia user a null y deja loading en false cuando restoreSession falla", async () => {
      useAuthStore.setState({ user: usuarioPrueba, loading: true });
      mockApi.restoreSession.mockRejectedValueOnce(new Error("Fallo de red"));

      await expect(useAuthStore.getState().restoreSession()).resolves.toBeUndefined();

      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().loading).toBe(false);
    });
  });

  describe("login", () => {
    it("actualiza user y deja loading en false cuando las credenciales son válidas", async () => {
      useAuthStore.setState({ user: null, loading: true });
      mockApi.login.mockResolvedValueOnce(usuarioPrueba);

      await useAuthStore.getState().login("mgonzalez", "ClaveSegura123");

      expect(mockApi.login).toHaveBeenCalledWith("mgonzalez", "ClaveSegura123");
      expect(useAuthStore.getState().user).toEqual(usuarioPrueba);
      expect(useAuthStore.getState().loading).toBe(false);
    });

    it("propaga el error y mantiene user sin cambios si falla el inicio de sesión", async () => {
      const errorCredenciales = new Error("Credenciales inválidas");
      mockApi.login.mockRejectedValueOnce(errorCredenciales);

      await expect(
        useAuthStore.getState().login("mgonzalez", "incorrecta")
      ).rejects.toThrow("Credenciales inválidas");

      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe("register", () => {
    it("actualiza user y deja loading en false cuando el registro es exitoso", async () => {
      useAuthStore.setState({ user: null, loading: true });
      const usuarioCreado: User = {
        id: "u2",
        username: datosRegistro.username,
        name: datosRegistro.name,
        lastName: datosRegistro.lastName,
        mail: datosRegistro.mail,
        initials: "LR",
        avatarColor: "#2dd67b",
      };
      mockApi.register.mockResolvedValueOnce(usuarioCreado);

      await useAuthStore.getState().register(datosRegistro);

      expect(mockApi.register).toHaveBeenCalledWith(datosRegistro);
      expect(useAuthStore.getState().user).toEqual(usuarioCreado);
      expect(useAuthStore.getState().loading).toBe(false);
    });

    it("propaga el error y no asigna user si el registro falla", async () => {
      mockApi.register.mockRejectedValueOnce(new Error("El usuario ya existe"));

      await expect(useAuthStore.getState().register(datosRegistro)).rejects.toThrow(
        "El usuario ya existe"
      );

      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe("logout", () => {
    it("llama a api.logout y limpia user a null", async () => {
      useAuthStore.setState({ user: usuarioPrueba, loading: false });
      mockApi.logout.mockResolvedValueOnce(undefined);

      await useAuthStore.getState().logout();

      expect(mockApi.logout).toHaveBeenCalledTimes(1);
      expect(useAuthStore.getState().user).toBeNull();
    });

    it("propaga el error si falla el cierre de sesión sin limpiar user", async () => {
      useAuthStore.setState({ user: usuarioPrueba, loading: false });
      mockApi.logout.mockRejectedValueOnce(new Error("Sin conexión"));

      await expect(useAuthStore.getState().logout()).rejects.toThrow("Sin conexión");

      expect(useAuthStore.getState().user).toEqual(usuarioPrueba);
    });
  });

  describe("onSessionExpired", () => {
    it("limpia user a null cuando el cliente API notifica sesión expirada", () => {
      expect(callbacksSesionExpirada).toHaveLength(1);
      useAuthStore.setState({ user: usuarioPrueba, loading: false });

      callbacksSesionExpirada[0]();

      expect(useAuthStore.getState().user).toBeNull();
    });
  });
});
