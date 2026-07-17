"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, LogOut } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

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

      <div className="mt-6 flex justify-center">
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
    </div>
  );
}