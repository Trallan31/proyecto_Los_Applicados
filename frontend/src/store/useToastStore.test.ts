import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "../types/users";

vi.mock("../api/client", () => ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  restoreSession: vi.fn().mockResolvedValue(null),
  onSessionExpired: vi.fn(() => () => {}),
}));

import { useAuthStore } from "./useAuthStore";
import { useToastStore } from "./useToastStore";

const usuarioUno: User = {
  id: "u1",
  username: "ana",
  name: "Ana",
  lastName: "Pérez",
  mail: "ana@uc.cl",
  initials: "AP",
  avatarColor: "#4f7cff",
};

const usuarioDos: User = {
  id: "u2",
  username: "beto",
  name: "Beto",
  lastName: "Silva",
  mail: "beto@uc.cl",
  initials: "BS",
  avatarColor: "#2dd67b",
};

describe("useToastStore", () => {
  beforeAll(async () => {
    // Espera a que termine el restoreSession() automático de useAuthStore.
    await vi.waitFor(() => {
      expect(useAuthStore.getState().loading).toBe(false);
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, loading: false });
    useToastStore.getState().clearToasts();
  });

  describe("addToast, showSuccess y showError", () => {
    it("genera IDs únicos, usa variante success por defecto y conserva opciones", () => {
      const accion = vi.fn();
      const id1 = useToastStore.getState().addToast({
        message: "Guardado correctamente",
        actionLabel: "Deshacer",
        onAction: accion,
        duration: 4000,
      });
      const id2 = useToastStore.getState().addToast({
        message: "Ocurrió un problema",
        variant: "error",
      });

      expect(id1).not.toBe(id2);

      const toasts = useToastStore.getState().toasts;
      expect(toasts).toHaveLength(2);
      expect(toasts[0]).toEqual({
        id: id1,
        message: "Guardado correctamente",
        variant: "success",
        actionLabel: "Deshacer",
        onAction: accion,
        duration: 4000,
      });
      expect(toasts[1]).toEqual({
        id: id2,
        message: "Ocurrió un problema",
        variant: "error",
      });
    });

    it("showSuccess y showError crean notificaciones con variante correcta e IDs únicos", () => {
      const idExito = useToastStore.getState().showSuccess("Tarea creada", { tag: "crear" });
      const idError = useToastStore.getState().showError("Error de servidor", { duration: 6000 });

      expect(idExito).not.toBe(idError);

      const toasts = useToastStore.getState().toasts;
      expect(toasts).toEqual([
        {
          id: idExito,
          message: "Tarea creada",
          variant: "success",
          tag: "crear",
        },
        {
          id: idError,
          message: "Error de servidor",
          variant: "error",
          duration: 6000,
        },
      ]);
    });
  });

  describe("deduplicación por tag", () => {
    it("reemplaza la notificación previa cuando comparten el mismo tag", () => {
      useToastStore.getState().showSuccess("Guardando...", { tag: "sync" });
      useToastStore.getState().showSuccess("Otro aviso", { tag: "otro" });
      const idReemplazo = useToastStore.getState().showError("Falló la sincronización", {
        tag: "sync",
      });

      const toasts = useToastStore.getState().toasts;
      expect(toasts).toHaveLength(2);
      expect(toasts.map((t) => t.tag)).toEqual(["otro", "sync"]);
      expect(toasts[1]).toEqual({
        id: idReemplazo,
        message: "Falló la sincronización",
        variant: "error",
        tag: "sync",
      });
    });

    it("mantiene múltiples notificaciones cuando no tienen tag", () => {
      useToastStore.getState().showSuccess("Primero");
      useToastStore.getState().showSuccess("Segundo");

      expect(useToastStore.getState().toasts).toHaveLength(2);
    });
  });

  describe("límite máximo de toasts", () => {
    it("conserva únicamente los 5 toasts más recientes", () => {
      const ids: string[] = [];
      for (let i = 1; i <= 7; i += 1) {
        ids.push(useToastStore.getState().showSuccess(`Aviso ${i}`));
      }

      const toasts = useToastStore.getState().toasts;
      expect(toasts).toHaveLength(5);
      expect(toasts.map((t) => t.id)).toEqual(ids.slice(2));
      expect(toasts.map((t) => t.message)).toEqual([
        "Aviso 3",
        "Aviso 4",
        "Aviso 5",
        "Aviso 6",
        "Aviso 7",
      ]);
    });
  });

  describe("removeToast, removeByTag y clearToasts", () => {
    it("removeToast elimina solo la notificación con el id indicado", () => {
      const id1 = useToastStore.getState().showSuccess("Uno");
      const id2 = useToastStore.getState().showError("Dos");

      useToastStore.getState().removeToast(id1);
      expect(useToastStore.getState().toasts.map((t) => t.id)).toEqual([id2]);

      const estadoPrevio = useToastStore.getState().toasts;
      useToastStore.getState().removeToast("id-inexistente");
      expect(useToastStore.getState().toasts).toBe(estadoPrevio);
    });

    it("removeByTag elimina las notificaciones con esa etiqueta y conserva las demás", () => {
      useToastStore.getState().showSuccess("A", { tag: "grupo-1" });
      useToastStore.getState().showSuccess("B", { tag: "grupo-2" });
      useToastStore.getState().showError("C");

      useToastStore.getState().removeByTag("grupo-1");
      expect(useToastStore.getState().toasts.map((t) => t.message)).toEqual(["B", "C"]);

      const estadoPrevio = useToastStore.getState().toasts;
      useToastStore.getState().removeByTag("tag-inexistente");
      expect(useToastStore.getState().toasts).toBe(estadoPrevio);
    });

    it("clearToasts vacía todas las notificaciones y es idempotente", () => {
      useToastStore.getState().showSuccess("Uno");
      useToastStore.getState().showError("Dos");

      useToastStore.getState().clearToasts();
      expect(useToastStore.getState().toasts).toEqual([]);

      const referenciaVacia = useToastStore.getState().toasts;
      useToastStore.getState().clearToasts();
      expect(useToastStore.getState().toasts).toBe(referenciaVacia);
    });
  });

  describe("suscripción a useAuthStore", () => {
    it("limpia los toasts automáticamente al iniciar sesión, cambiar de cuenta y cerrar sesión", () => {
      // Inicio de sesión (null -> u1)
      useToastStore.getState().showSuccess("Antes de login");
      expect(useToastStore.getState().toasts).toHaveLength(1);
      useAuthStore.setState({ user: usuarioUno, loading: false });
      expect(useToastStore.getState().toasts).toEqual([]);

      // Cambio de cuenta (u1 -> u2)
      useToastStore.getState().showSuccess("Sesión de Ana");
      expect(useToastStore.getState().toasts).toHaveLength(1);
      useAuthStore.setState({ user: usuarioDos, loading: false });
      expect(useToastStore.getState().toasts).toEqual([]);

      // Cierre de sesión (u2 -> null)
      useToastStore.getState().showError("Sesión de Beto");
      expect(useToastStore.getState().toasts).toHaveLength(1);
      useAuthStore.setState({ user: null, loading: false });
      expect(useToastStore.getState().toasts).toEqual([]);
    });

    it("no limpia los toasts si se actualiza el usuario manteniendo el mismo id", () => {
      useAuthStore.setState({ user: usuarioUno, loading: false });
      useToastStore.getState().showSuccess("Notificación activa");

      useAuthStore.setState({
        user: { ...usuarioUno, name: "Ana María" },
        loading: false,
      });

      expect(useToastStore.getState().toasts).toHaveLength(1);
    });
  });
});
