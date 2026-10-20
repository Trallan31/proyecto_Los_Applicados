import { useState, useEffect, useCallback } from "react";
import { list, create, update, remove, describeError } from "../api/client";

export interface Collection<T> {
  items: T[];
  loading: boolean;
  error: string | null;
  loadError: string | null;
  mutationError: string | null;
  clearMutationError: () => void;
  refetch: () => Promise<void>;
  add: (body: Omit<T, "id">) => Promise<T | null>;
  edit: (id: string, changes: Partial<Omit<T, "id">>) => Promise<boolean>;
  destroy: (id: string) => Promise<boolean>;
}

/**
 * Mantiene sincronizada una coleccion REST con el estado local.
 *
 * Carga una vez al montar y despues de cada escritura confirmada por el
 * servidor actualiza el estado en memoria, para no volver a pedir la lista
 * entera.
 *
 * Distingue entre loadError (fallo al pedir la lista inicial o refetch) y
 * mutationError (fallo en add/edit/destroy). `error` mantiene compatibilidad
 * exponiendo `loadError`.
 */
export function useCollection<T extends { id: string }>(resource: string): Collection<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await list<T>(resource);
      setItems(data);
      setLoadError(null);
    } catch (e) {
      setLoadError(describeError(e));
    } finally {
      setLoading(false);
    }
  }, [resource]);

  useEffect(() => {
    let cancelled = false;
    list<T>(resource)
      .then((data) => {
        if (cancelled) return;
        setItems(data);
        setLoadError(null);
      })
      .catch((e) => {
        if (!cancelled) setLoadError(describeError(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [resource]);

  const clearMutationError = useCallback(() => {
    setMutationError(null);
  }, []);

  const add = useCallback(
    async (body: Omit<T, "id">): Promise<T | null> => {
      try {
        const created = await create<T>(resource, body);
        setItems((prev) => [...prev, created]);
        setMutationError(null);
        return created;
      } catch (e) {
        setMutationError(describeError(e));
        return null;
      }
    },
    [resource]
  );

  const edit = useCallback(
    async (id: string, changes: Partial<Omit<T, "id">>): Promise<boolean> => {
      try {
        const updated = await update<T>(resource, id, changes);
        setItems((previous) => previous.map((item) => item.id === id ? updated : item));
        setMutationError(null);
        return true;
      } catch (error: unknown) {
        setMutationError(describeError(error));
        return false;
      }
    },
    [resource]
  );

  const destroy = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await remove(resource, id);
        setItems((previous) => previous.filter((item) => item.id !== id));
        setMutationError(null);
        return true;
      } catch (error: unknown) {
        setMutationError(describeError(error));
        return false;
      }
    },
    [resource]
  );

  return {
    items,
    loading,
    error: loadError,
    loadError,
    mutationError,
    clearMutationError,
    refetch: fetchData,
    add,
    edit,
    destroy,
  };
}
