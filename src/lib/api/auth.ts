import { apiClient } from "./client";
import type { AuthUser } from "@/entities";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    role: "PRACTICANT" | "ADMIN";
    isEmailVerified: boolean;
  };
  token: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "PRACTICANT" | "ADMIN";
}

export interface RegisterResponse {
  id: string;
  email: string;
  role: string;
  token: string;
  message: string;
}

export interface VerifyEmailResponse {
  id: string;
  email: string;
  isEmailVerified: boolean;
  verifiedAt: string;
}

/**
 * Войти по email + пароль.
 * POST /api/auth/login
 * Ответ: { user: { id, email, role, isEmailVerified }, token }
 */
export function login(data: LoginRequest) {
  return apiClient.post<LoginResponse>("/auth/login", data, {
    skipAuth: true,
  });
}

/**
 * Зарегистрироваться.
 * POST /api/auth/register
 * Тело: { email, password, firstName, lastName, role }
 */
export function register(data: RegisterRequest) {
  return apiClient.post<RegisterResponse>("/auth/register", data, {
    skipAuth: true,
  });
}

/**
 * Получить текущего пользователя по токену.
 * GET /api/auth/me
 */
export function fetchMe() {
  return apiClient.get<AuthUser>("/auth/me", { skipUnauthorizedRedirect: true });
}

/**
 * Подтвердить email по токену из письма.
 * GET /api/auth/verify-email?token=...
 */
export function verifyEmail(token: string) {
  return apiClient.get<VerifyEmailResponse>("/auth/verify-email", {
    params: { token },
    skipAuth: true,
  });
}

/**
 * Отправить письмо повторно для подтверждения email.
 * POST /api/auth/resend-verification
 */
export function resendVerification(email: string) {
  return apiClient.post<{ message: string }>(
    "/auth/resend-verification",
    { email },
    { skipAuth: true },
  );
}

/**
 * Запросить сброс пароля.
 * POST /api/auth/forgot-password
 */
export function forgotPassword(email: string) {
  return apiClient.post<{ message: string }>(
    "/auth/forgot-password",
    { email },
    { skipAuth: true },
  );
}

/**
 * Установить новый пароль по токену сброса.
 * POST /api/auth/reset-password
 */
export function resetPassword(token: string, password: string) {
  return apiClient.post<{ message: string }>(
    "/auth/reset-password",
    { token, password },
    { skipAuth: true },
  );
}