"use client";

import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LogoFull } from "@/components/logo";

export function SiteHeader() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  const initials = user?.email?.charAt(0).toUpperCase() ?? "?";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Логотип */}
        <Link href="/" className="shrink-0">
          <LogoFull />
        </Link>

        {/* Правая часть */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {isLoading ? (
            <Skeleton className="h-8 w-20 rounded-md" />
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              {user.role === "ADMIN" && (
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link href="/cohorts" />}
                  nativeButton={false}
                >
                  Админ панель
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                render={<Link href="/applications" />}
                nativeButton={false}
              >
                Личный кабинет
              </Button>
              <Link
                href="/profile"
                className="flex h-8 w-8 items-center justify-center rounded-full transition-opacity hover:opacity-80"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                render={<Link href="/login" />}
                nativeButton={false}
              >
                Войти
              </Button>
              <Button
                size="sm"
                render={<Link href="/register" />}
                nativeButton={false}
              >
                Регистрация
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}