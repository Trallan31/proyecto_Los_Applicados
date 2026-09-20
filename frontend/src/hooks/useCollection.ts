import { useState, useEffect, useCallback } from "react";
import { list, create, update, remove, describeError } from "../api/client";

export interface Collection<T> {
  items: T[];
  loading: boolean;
  error: string | null;
  add: (body: Omit<T, "id">) => Promise<T | null>;
  edit: (id: string, changes: Partial<Omit<T, "id">>) => Promise<void>;
  destroy: (id: string) => Promise<void>;
}

/**
 * Mantiene sincronizada una coleccion REST con el estado local.
 *
 * Carga una vez al montar y despues de cada escritura confirmada por el
 * servidor actualiza el estado en memoria, para no volver a pedir la lista
 * entera. Si una escritura falla, el estado local no se toca y el error
 * queda expuesto en `error`.
 */
export function useCollection<T extends { id: string }>(resource: string): Collection<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // El recurso es fijo durante toda la vida del hook, asi que esto corre
  // una sola vez. `loading` ya nace en true: no hace falta reiniciarlo.
  useEffect(() => {
    let cancelled = false;
    list<T>(resource)
      .then((data) => {
        if (cancelled) return;
        setItems(data);
        setError(null);
      })
      .catch((e) => {
        if (!cancelled) setError(describeError(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [resource]);

  const add = useCallback(
    async (body: Omit<T, "id">): Promise<T | null> => {
      try {
        const created = await create<T>(resource, body);
        setItems((prev) => [...prev, created]);
        return created;
      } catch (e) {
        setError(describeError(e));
        return null;
      }
    },
    [resource]
  );

  const edit = useCallback(
    async (id: string, changes: Partial<Omit<T, "id">>): Promise<void> => {
      try {
        const updated = await update<T>(resource, id, changes);
        setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
      } catch (e) {
        setError(describeError(e));
      }
    },
    [resource]
  );

  const destroy = useCallback(
    async (id: string): Promise<void> => {
      try {
        await remove(resource, id);
        setItems((prev) => prev.filter((item) => item.id !== id));
      } catch (e) {
        setError(describeError(e));
      }
    },
    [resource]
  );

  return { items, loading, error, add, edit, destroy };
}
