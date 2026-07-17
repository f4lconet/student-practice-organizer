"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { useAuth } from "@/providers/auth-provider";
import { loginSchema, type LoginFormData } from "@/features/auth/schemas";
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

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [isPending, setIsPending] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormData) {
    setIsPending(true);
    form.clearErrors();

    try {
      const user = await login(data.email, data.password);

      toast.success("Вы успешно вошли в систему");

      // Редирект по роли
      if (user.role === "ADMIN") {
        router.push("/cohorts");
      } else {
        router.push("/applications");
      }

      router.refresh();
    } catch (error) {
      if (error instanceof ApiError) {
        form.setError("root", {
          message: "Убедитесь что вы верно ввели почту и пароль",
        });
      } else {
        form.setError("root", {
          message: "Произошла ошибка при входе. Попробуйте позже.",
        });
        toast.error("Произошла ошибка при входе");
      }
    } finally {
      setIsPending(false);
    }
  }

  return (
    <main className="container mx-auto flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Вход</CardTitle>
          <CardDescription>
            Введите email и пароль для входа в систему
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {form.formState.errors.root && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  {form.formState.errors.root.message}
                </div>
              )}
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
                        placeholder="••••••"
                        autoComplete="current-password"
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
                {isPending ? "Вход..." : "Войти"}
              </Button>
            </form>
          </Form>

          <div className="mt-4 space-y-2 text-center text-sm text-muted-foreground">
            <p>
              Нет аккаунта?{" "}
              <Link
                href="/register"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Зарегистрироваться
              </Link>
            </p>
            <p>
              <Link
                href="/forgot-password"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Забыли пароль?
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}