"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { useAuth } from "@/providers/auth-provider";
import { useTheme } from "@/providers/theme-provider";
import { changePassword } from "@/lib/api/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, LogOut, KeyRound, Moon, Sun } from "lucide-react";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Введите текущий пароль"),
  newPassword: z.string().min(8, "Новый пароль должен быть не короче 8 символов"),
  confirmPassword: z.string().min(1, "Подтвердите новый пароль"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      changePassword(data.currentPassword, data.newPassword),
    onSuccess: () => {
      toast.success("Пароль успешно изменён");
      setPasswordDialogOpen(false);
      form.reset();
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Ошибка при смене пароля";
      toast.error(message);
    },
  });

  const onSubmit = useCallback(
    (data: PasswordFormData) => {
      changePasswordMutation.mutate({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
    },
    [changePasswordMutation],
  );

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  if (isLoading || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="mb-8 h-8 w-48" />
        <Skeleton className="h-64 w-full max-w-lg" />
      </div>
    );
  }

  const initials = user.email.charAt(0).toUpperCase();

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={() => router.back()}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Назад
      </Button>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>Профиль</CardTitle>
            <p className="text-sm text-muted-foreground">
              {user.role === "ADMIN" ? "Администратор" : "Практикант"}
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{user.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Роль</p>
            <p className="font-medium">
              {user.role === "ADMIN" ? "Администратор" : "Практикант"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email подтверждён</p>
            <p className="font-medium">
              {user.isEmailVerified ? "Да" : "Нет"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Дата регистрации</p>
            <p className="font-medium">
              {user.createdAt
                ? new Date(user.createdAt).toLocaleDateString("ru-RU")
                : "—"}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex flex-col gap-3">
        {/* Кнопка смены пароля */}
        <Button
          variant="outline"
          className="w-full max-w-lg"
          onClick={() => setPasswordDialogOpen(true)}
        >
          <KeyRound className="mr-2 h-4 w-4" />
          Сменить пароль
        </Button>

        {/* Кнопка переключения темы */}
        <Button
          variant="outline"
          className="w-full max-w-lg"
          onClick={toggleTheme}
        >
          {resolvedTheme === "dark" ? (
            <Sun className="mr-2 h-4 w-4" />
          ) : (
            <Moon className="mr-2 h-4 w-4" />
          )}
          {resolvedTheme === "dark" ? "Светлая тема" : "Тёмная тема"}
        </Button>

        {/* Кнопка выхода */}
        <Button
          variant="outline"
          className="w-full max-w-lg"
          onClick={() => {
            logout();
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Выйти
        </Button>
      </div>

      {/* Диалог смены пароля */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Сменить пароль</DialogTitle>
            <DialogDescription>
              Введите текущий и новый пароль
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="currentPassword" className="mb-1.5 block text-sm font-medium">
                  Текущий пароль
                </Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="••••••••"
                  {...form.register("currentPassword")}
                />
                {form.formState.errors.currentPassword && (
                  <p className="mt-1 text-xs text-destructive">
                    {form.formState.errors.currentPassword.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="newPassword" className="mb-1.5 block text-sm font-medium">
                  Новый пароль
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Минимум 8 символов"
                  {...form.register("newPassword")}
                />
                {form.formState.errors.newPassword && (
                  <p className="mt-1 text-xs text-destructive">
                    {form.formState.errors.newPassword.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium">
                  Подтвердите новый пароль
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Повторите новый пароль"
                  {...form.register("confirmPassword")}
                />
                {form.formState.errors.confirmPassword && (
                  <p className="mt-1 text-xs text-destructive">
                    {form.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPasswordDialogOpen(false)}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={changePasswordMutation.isPending}>
                {changePasswordMutation.isPending ? "Сохранение..." : "Сохранить"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}