/**
 * Zod-схемы валидации для форм авторизации.
 */
import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Введите email")
    .email("Некорректный email"),
  password: z
    .string()
    .min(1, "Введите пароль"),
});

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(1, "Введите имя"),
    lastName: z
      .string()
      .min(1, "Введите фамилию"),
    email: z
      .string()
      .min(1, "Введите email")
      .email("Некорректный email"),
    password: z
      .string()
      .min(8, "Минимальная длина пароля — 8 символов")
      .regex(/[A-Z]/, "Пароль должен содержать хотя бы одну заглавную букву")
      .regex(/[0-9]/, "Пароль должен содержать хотя бы одну цифру")
      .regex(/[^a-zA-Z0-9]/, "Пароль должен содержать хотя бы один специальный символ"),
    confirmPassword: z
      .string()
      .min(1, "Подтвердите пароль"),
    role: z.enum(["PRACTICANT", "ADMIN"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;