"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import { fetchPublicActiveCohort } from "@/lib/api/survey";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Logo } from "@/components/logo";
import {
  ClipboardCheck,
  FileText,
  ListChecks,
  MessageSquareText,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: ClipboardCheck,
    title: "Подача заявок",
    description:
      "Заполните анкету и подайте заявку на практику в несколько кликов. Все данные сохраняются автоматически.",
  },
  {
    icon: FileText,
    title: "Загрузка документов",
    description:
      "Загружайте необходимые документы напрямую в систему. Руководитель увидит их сразу после загрузки.",
  },
  {
    icon: ListChecks,
    title: "Отслеживание статуса",
    description:
      "Следите за статусом заявки в реальном времени: от подачи до утверждения.",
  },
  {
    icon: MessageSquareText,
    title: "Обратная связь",
    description:
      "Получайте комментарии и замечания от руководителя практики и оперативно вносите правки.",
  },
];

export default function HomePage() {
  const { user, isLoading, isAuthenticated } = useAuth();

  const { data: activeCohort } = useQuery({
    queryKey: ["public", "active-cohort"],
    queryFn: () => fetchPublicActiveCohort().catch(() => null),
    staleTime: 5 * 60 * 1000,
  });

  const surveyHref = activeCohort
    ? `/survey/${activeCohort.name}`
    : "/survey/current";

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero-секция */}
        <section className="relative overflow-hidden">
          {/* Фоновый градиент */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10"
          >
            <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
          </div>

          <div className="container mx-auto flex flex-col items-center px-4 pt-20 pb-16 text-center sm:pt-28 sm:pb-20">
          {/* Заголовок */}
            <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
              Организация
              <span className="block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                учебной практики
              </span>
            </h1>

            {/* Подзаголовок */}
            <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg leading-relaxed">
              Сервис для организации и сопровождения приёма студентов на практику.
              Подавайте заявки, загружайте документы, отслеживайте статус
              и взаимодействуйте с руководителями — всё в одном месте.
            </p>

            {/* CTA-кнопки */}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {isLoading ? (
                <div className="flex flex-wrap gap-3">
                  <Skeleton className="h-10 w-40" />
                  <Skeleton className="h-10 w-40" />
                </div>
              ) : isAuthenticated && user ? (
                <>
                  <Button
                    size="lg"
                    render={<Link href={surveyHref} />}
                    nativeButton={false}
                  >
                    Заявка на практику
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    render={<Link href="/applications" />}
                    nativeButton={false}
                  >
                    Личный кабинет
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="lg"
                    render={<Link href={surveyHref} />}
                    nativeButton={false}
                  >
                    Подать заявку
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    render={<Link href="/register" />}
                    nativeButton={false}
                  >
                    Зарегистрироваться
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Секция "Возможности" */}
        <section className="border-t bg-muted/30">
          <div className="container mx-auto px-4 py-16 sm:py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Всё необходимое для практики
              </h2>
              <p className="mt-3 text-muted-foreground">
                Простой и понятный интерфейс для студентов и руководителей.
              </p>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-xl border bg-card p-6 transition-shadow hover:shadow-md"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA-секция */}
        <section>
          <div className="container mx-auto px-4 py-16 sm:py-20">
            <div className="mx-auto max-w-lg rounded-2xl border bg-card p-8 text-center shadow-sm sm:p-10">
              <h2 className="text-xl font-bold sm:text-2xl">
                Готовы начать?
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                {isAuthenticated && user
                  ? "Перейдите в личный кабинет, чтобы продолжить работу."
                  : "Зарегистрируйтесь или войдите, чтобы подать заявку на практику."}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {isAuthenticated && user ? (
                  <Button
                    size="lg"
                    render={<Link href={surveyHref} />}
                    nativeButton={false}
                  >
                    Перейти к заявке
                  </Button>
                ) : (
                  <>
                    <Button
                      size="lg"
                      render={<Link href="/register" />}
                      nativeButton={false}
                    >
                      Регистрация
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      render={<Link href="/login" />}
                      nativeButton={false}
                    >
                      Войти
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}