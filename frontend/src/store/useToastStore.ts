import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";

export type ToastVariant = "success" | "error";

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
  tag?: string;
}

export type ToastOptions = Omit<ToastItem, "id" | "message" | "variant">;

export interface ToastInput extends ToastOptions {
  message: string;
  variant?: ToastVariant;
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (toast: ToastInput) => string;
  showSuccess: (message: string, options?: ToastOptions) => string;
  showError: (message: string, options?: ToastOptions) => string;
  removeToast: (id: string) => void;
  removeByTag: (tag: string) => void;
  clearToasts: () => void;
}

const MAX_TOASTS = 5;
let toastSequence = 0;

/** Store global de notificaciones temporales (toasts). */
export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const id = `toast-${++toastSequence}`;
    const nextToast: ToastItem = {
      ...toast,
      id,
      variant: toast.variant ?? "success",
    };

    set((state) => {
      // Si tiene etiqueta, reemplaza la notificación previa con la misma etiqueta.
      const filtered = nextToast.tag
        ? state.toasts.filter((item) => item.tag !== nextToast.tag)
        : state.toasts;
      const next = [...filtered, nextToast].slice(-MAX_TOASTS);
      return { toasts: next };
    });

    return id;
  },

  showSuccess: (message, options) =>
    get().addToast({ ...options, message, variant: "success" }),

  showError: (message, options) =>
    get().addToast({ ...options, message, variant: "error" }),

  removeToast: (id) =>
    set((state) => {
      const next = state.toasts.filter((item) => item.id !== id);
      return next.length === state.toasts.length ? state : { toasts: next };
    }),

  removeByTag: (tag) =>
    set((state) => {
      const next = state.toasts.filter((item) => item.tag !== tag);
      return next.length === state.toasts.length ? state : { toasts: next };
    }),

  clearToasts: () =>
    set((state) => (state.toasts.length === 0 ? state : { toasts: [] })),
}));

// Si el usuario cierra sesión, expira o cambia de cuenta, se descartan las notificaciones activas.
useAuthStore.subscribe((state, previous) => {
  if (state.user?.id !== previous.user?.id) {
    useToastStore.getState().clearToasts();
  }
});
