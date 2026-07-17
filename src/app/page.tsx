"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import { fetchPublicActiveCohort } from "@/lib/api/survey";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HomePage() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  // Пытаемся получить активную когорту для ссылки на анкету
  const { data: activeCohort } = useQuery({
    queryKey: ["public", "active-cohort"],
    queryFn: () => fetchPublicActiveCohort().catch(() => null),
    staleTime: 5 * 60 * 1000,
  });

  const surveyHref = activeCohort ? `/survey/${activeCohort.name}` : "/survey/current";

  return (
    <main className="container mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 py-12">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Практика</CardTitle>
          <CardDescription>
            Сервис для организации приёма студентов на практику
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap justify-center gap-3">
          {isLoading ? (
            <div className="flex flex-wrap gap-3">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-40" />
            </div>
          ) : isAuthenticated && user ? (
            <>
              <Button
                render={<Link href={surveyHref} />}
                nativeButton={false}
              >
                Заявка на практику
              </Button>
              <Button
                variant="outline"
                render={<Link href="/applications" />}
                nativeButton={false}
              >
                Личный кабинет
              </Button>
              {user.role === "ADMIN" && (
                <Button
                  variant="outline"
                  render={<Link href="/cohorts" />}
                  nativeButton={false}
                >
                  Админ-панель
                </Button>
              )}
              <Button variant="secondary" onClick={() => logout()}>
                Выйти
              </Button>
            </>
          ) : (
            <>
              <Button
                render={<Link href={surveyHref} />}
                nativeButton={false}
              >
                Заявка на практику
              </Button>
              <Button
                variant="outline"
                render={<Link href="/login" />}
                nativeButton={false}
              >
                Войти
              </Button>
              <Button
                variant="outline"
                render={<Link href="/register" />}
                nativeButton={false}
              >
                Зарегистрироваться
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}