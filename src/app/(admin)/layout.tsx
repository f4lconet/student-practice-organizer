"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAdminCohortStore } from "@/lib/stores/admin-cohort-store";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

const adminNavItems = [
  { label: "Заявки", path: "applications" },
  { label: "Документы", path: "documents" },
  { label: "Задачи", path: "tasks" },
  { label: "Настройки", path: "settings" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user)) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, user, router]);
  const selectedCohortId = useAdminCohortStore((s) => s.selectedCohortId);
  const setSelectedCohortId = useAdminCohortStore((s) => s.setSelectedCohortId);
  const [loggingOut, setLoggingOut] = useState(false);

  const isOnCohortPage = pathname === "/cohorts";
  const segments = pathname.split("/").filter(Boolean);
  const cohortIdFromUrl =
    segments.length >= 1 && segments[0] !== "cohorts" ? segments[0] : null;

  // Sync cohortId from URL to store
  if (cohortIdFromUrl && cohortIdFromUrl !== selectedCohortId) {
    setSelectedCohortId(cohortIdFromUrl);
  }

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
  };

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="mb-8 h-12 w-full max-w-md" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const initials = user.email.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* Шапка админки */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            {/* Кнопка "Назад" */}
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <Link href="/cohorts" className="text-lg font-semibold tracking-tight">
              Практика · Админ
            </Link>

            {/* Навигация по вкладкам внутри когорты */}
            {!isOnCohortPage && cohortIdFromUrl && (
              <nav className="hidden md:flex items-center gap-1">
                {adminNavItems.map((item) => {
                  const href = `/${cohortIdFromUrl}/${item.path}`;
                  const isActive =
                    pathname === href || pathname.startsWith(`${href}/`);
                  return (
                    <Button
                      key={item.path}
                      variant={isActive ? "secondary" : "ghost"}
                      size="sm"
                      render={<Link href={href} />}
                      nativeButton={false}
                    >
                      {item.label}
                    </Button>
                  );
                })}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-4">
            {!isOnCohortPage && cohortIdFromUrl && (
              <Button
                variant="outline"
                size="sm"
                render={<Link href="/cohorts" />}
                nativeButton={false}
              >
                Сменить когорту
              </Button>
            )}

          <Link
            href="/profile"
            className="flex h-8 w-8 items-center justify-center rounded-full transition-opacity hover:opacity-80"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Link>
          </div>
        </div>

        {/* Мобильная навигация */}
        {!isOnCohortPage && cohortIdFromUrl && (
          <div className="md:hidden border-t px-4 py-2 flex gap-1 overflow-x-auto">
            {adminNavItems.map((item) => {
              const href = `/${cohortIdFromUrl}/${item.path}`;
              const isActive =
                pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Button
                  key={item.path}
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  render={<Link href={href} />}
                  nativeButton={false}
                >
                  {item.label}
                </Button>
              );
            })}
          </div>
        )}
      </header>

      {/* Основной контент */}
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}