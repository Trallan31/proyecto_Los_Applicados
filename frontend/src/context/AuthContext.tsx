import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from "../types/users";
import * as api from "../api/client";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (
    username: string,
    password: string
  ) => Promise<void>;
  register: (data: api.RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<
  AuthContextType | undefined
>(undefined);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const unsubscribe = api.onSessionExpired(() => {
      if (active) {
        setUser(null);
      }
    });

    async function restore() {
      try {
        const restoredUser = await api.restoreSession();
        if (active) {
          setUser(restoredUser);
        }
      } catch {
        // Si no se pudo verificar la sesión, no damos acceso.
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    void restore();
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  async function login(
    username: string,
    password: string
  ): Promise<void> {
    const authenticatedUser = await api.login(
      username,
      password
    );
    setUser(authenticatedUser);
  }
  async function register(
    data: api.RegisterData
  ): Promise<void> {
    const authenticatedUser = await api.register(data);
    setUser(authenticatedUser);
  }
  async function logout(): Promise<void> {
    await api.logout();
    setUser(null);
  }
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Mismo patrón que el hook useTheme del proyecto.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(
      "useAuth debe usarse dentro de AuthProvider"
    );
  }
  return context;
}
