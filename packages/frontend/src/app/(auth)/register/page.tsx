"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { useAuth } from "@/providers/auth-provider";
import { registerSchema, type RegisterFormData } from "@/features/auth/schemas";
import { resendVerification } from "@/lib/api/auth";
import { ApiError } from "@/lib/api";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Loader2, MailCheck } from "lucide-react";

type PageState = "form" | "success";

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [pageState, setPageState] = useState<PageState>("form");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Таймер обратного отсчёта для повторной отправки
  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  function startCooldown(seconds = 60) {
    setResendCooldown(seconds);
  }

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      role: "PRACTICANT",
    },
  });

  async function onSubmit(data: RegisterFormData) {
    setIsPending(true);
    form.clearErrors();

    try {
      await registerUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: "PRACTICANT",
      });

      setRegisteredEmail(data.email);
      setPageState("success");
      startCooldown(60);
      toast.success("Регистрация прошла успешно! Проверьте почту.");
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          form.setError("email", {
            message: "Этот email уже зарегистрирован",
          });
        } else {
          form.setError("root", {
            message: error.message,
          });
          toast.error(error.message);
        }
      } else {
        form.setError("root", {
          message: "Произошла ошибка при регистрации. Попробуйте позже.",
        });
        toast.error("Произошла ошибка при регистрации");
      }
    } finally {
      setIsPending(false);
    }
  }

  async function handleResend() {
    setIsResending(true);
    try {
      await resendVerification(registeredEmail);
      toast.success("Письмо отправлено повторно! Проверьте почту.");
      startCooldown(60);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Не удалось отправить письмо. Попробуйте позже.");
      }
    } finally {
      setIsResending(false);
    }
  }

  if (pageState === "success") {
    return (
      <main className="container mx-auto flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center py-2">
              <MailCheck className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-center text-2xl font-bold">
              Проверьте почту
            </CardTitle>
            <CardDescription className="text-center">
              Мы отправили письмо для подтверждения email на адрес{" "}
              <span className="font-medium text-foreground">{registeredEmail}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Если письмо не пришло, проверьте папку «Спам» или нажмите кнопку ниже,
              чтобы отправить его снова.
            </p>

            <Button
              className="w-full"
              variant="outline"
              disabled={isResending || resendCooldown > 0}
              onClick={handleResend}
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Отправка...
                </>
              ) : resendCooldown > 0 ? (
                `Повторная отправка через ${resendCooldown} с`
              ) : (
                "Отправить письмо повторно"
              )}
            </Button>

            <Button
              className="w-full"
              onClick={() => router.push("/login")}
            >
              Перейти к входу
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Регистрация</CardTitle>
          <CardDescription>
            Создайте аккаунт для подачи заявки на практику
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Имя</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Иван"
                          autoComplete="given-name"
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Фамилия</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Иванов"
                          autoComplete="family-name"
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        autoComplete="email"
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Пароль</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder="Минимум 8 символов"
                        autoComplete="new-password"
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Подтверждение пароля</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder="Повторите пароль"
                        autoComplete="new-password"
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isPending}
              >
                {isPending ? "Регистрация..." : "Зарегистрироваться"}
              </Button>
            </form>
          </Form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Уже есть аккаунт?{" "}
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Войти
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
