"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { AuthUser } from "@/entities";
import { login as apiLogin, register as apiRegister, fetchMe, type RegisterRequest } from "@/lib/api/auth";
import { setAccessToken, clearAccessToken, getAccessToken } from "@/lib/api/token-strategy";
import { setAccessTokenGetter, setUnauthorizedHandler } from "@/lib/api/client";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (data: RegisterRequest) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  login: async () => {
    throw new Error("AuthProvider not ready");
  },
  register: async () => {
    throw new Error("AuthProvider not ready");
  },
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Настроить интерцептор 401 → logout + редирект
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearAccessToken();
      setUser(null);
      router.push("/login");
    });
  }, [router]);

  // Настроить getter токена для API-клиента
  useEffect(() => {
    setAccessTokenGetter(() => {
      return getAccessToken();
    });
  }, []);

  // При монтировании — пробуем восстановить сессию
  useEffect(() => {
    let cancelled = false;

    fetchMe()
      .then((authUser) => {
        if (!cancelled) setUser(authUser);
      })
      .catch(() => {
        if (!cancelled) {
          clearAccessToken();
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await apiLogin({ email, password });

      // Сохраняем токен из тела ответа
      setAccessToken(response.token);

      // Сразу делаем запрос /auth/me для полной информации о пользователе
      const authUser = await fetchMe();
      setUser(authUser);
      return authUser;
    },
    [],
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      const response = await apiRegister(data);

      // Сохраняем токен из тела ответа
      if (response.token) {
        setAccessToken(response.token);
      }

      // После регистрации пробуем получить профиль
      try {
        const authUser = await fetchMe();
        setUser(authUser);
        return authUser;
      } catch {
        // Если fetchMe не сработал (email не подтверждён), возвращаем базовые данные
        const basicUser: AuthUser = {
          id: response.id,
          email: response.email,
          role: response.role as AuthUser["role"],
          isEmailVerified: false,
          verifiedAt: null,
          createdAt: "",
        };
        setUser(basicUser);
        return basicUser;
      }
    },
    [],
  );

  const logout = useCallback(() => {
    clearAccessToken();
    setUser(null);
    router.push("/");
  }, [router]);

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}