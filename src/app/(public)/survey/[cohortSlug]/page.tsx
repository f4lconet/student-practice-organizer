"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams } from "next/navigation";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SurveyFieldInput } from "@/features/survey/survey-field-input";
import { useSurveyPage } from "@/features/survey/use-survey-page";
import { buildSurveySchema } from "@/lib/form-utils";
import type { TestTask } from "@/entities/test-task";
import { useAuth } from "@/providers/auth-provider";
import { AlertCircle, CheckCircle2, ArrowLeft, FileText, Clock, UserPlus } from "lucide-react";

export default function SurveyPage() {
  const params = useParams();
  const slug = params.cohortSlug as string;
  const { isAuthenticated } = useAuth();

  const {
    fields,
    cohort,
    isLoadingConfig,
    configError,
    isFieldsEmpty,
    isApplicationPeriodActive,
    isSubmitting,
    isSubmitted,
    handleSubmit,
    testTask,
    isLoadingTestTask,
    testTaskError,
    handleBackToHome,
  } = useSurveyPage(slug);

  // Динамическая генерация zod-схемы на основе полей
  const surveySchema = fields.length > 0 ? buildSurveySchema(fields) : null;

  const form = useForm<Record<string, string>>({
    resolver: surveySchema ? zodResolver(surveySchema) : undefined,
    defaultValues: fields.reduce<Record<string, string>>((acc, f) => {
      acc[f.id] = "";
      return acc;
    }, {}),
  });

  // ========== Состояние загрузки ==========
  if (isLoadingConfig) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Skeleton className="mb-6 h-8 w-48" />
        <Skeleton className="mb-4 h-4 w-96" />
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // ========== Состояние ошибки загрузки ==========
  if (configError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ошибка загрузки</AlertTitle>
          <AlertDescription>
            {configError.message === "Когорта не найдена"
              ? "Когорта не найдена. Проверьте правильность ссылки."
              : "Не удалось загрузить анкету. Попробуйте обновить страницу."}
          </AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" onClick={handleBackToHome}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          На главную
        </Button>
      </div>
    );
  }

  // ========== Когорта не найдена / нет активного приёма ==========
  if (!cohort) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Приём заявок закрыт
            </CardTitle>
            <CardDescription>
              В настоящее время нет когорты с открытым приёмом заявок.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Подача заявок на практику доступна только в период приёма активной когорты.
              Пожалуйста, зайдите позже.
            </p>
            <Button variant="outline" className="mt-4" onClick={handleBackToHome}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              На главную
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ========== Приём заявок закрыт ==========
  if (isApplicationPeriodActive === false || isFieldsEmpty) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Приём заявок закрыт
            </CardTitle>
            <CardDescription>
              {isFieldsEmpty
                ? "Анкета для данной когорты ещё не настроена."
                : `Приём заявок на когорту ${cohort.name} завершён.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {isFieldsEmpty
                ? "Пожалуйста, зайдите позже, когда администратор настроит анкету."
                : `Срок подачи заявок был с ${formatDate(cohort.applicationStart)} по ${formatDate(cohort.applicationEnd)}.`}
            </p>
            <Button variant="outline" className="mt-4" onClick={handleBackToHome}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              На главную
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ========== Анкета успешно отправлена ==========
  if (isSubmitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-6 w-6" />
              <CardTitle>Анкета отправлена!</CardTitle>
            </div>
            <CardDescription>
              Спасибо! Ваша анкета на когорту {cohort.name} успешно отправлена.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Separator />

            {/* Блок тестового задания */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                <FileText className="h-5 w-5" />
                Тестовое задание
              </h3>

              {isLoadingTestTask ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : testTaskError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Ошибка</AlertTitle>
                  <AlertDescription>
                    Не удалось загрузить тестовое задание. Попробуйте обновить страницу.
                  </AlertDescription>
                </Alert>
              ) : testTask && testTask.publishedAt ? (
                <div className="prose prose-sm max-w-none rounded-lg border bg-muted/50 p-4">
                  <div className="mb-2 text-xs text-muted-foreground">
                    Опубликовано: {formatDate(testTask.publishedAt)}
                  </div>
                  <div className="whitespace-pre-wrap">{testTask.content}</div>
                </div>
              ) : (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertTitle>Задание появится позже</AlertTitle>
                  <AlertDescription>
                    Тестовое задание ещё не опубликовано. Вам придёт уведомление на
                    электронную почту, когда задание будет доступно.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <Separator />

            <Button variant="outline" onClick={handleBackToHome}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              На главную
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ========== Форма анкеты ==========
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Анкета на практику</CardTitle>
          <CardDescription>
            Когорта {cohort.name} &mdash; приём заявок до{" "}
            {formatDate(cohort.applicationEnd)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isAuthenticated && (
            <Alert className="mb-6">
              <AlertDescription>
                Вы можете заполнить анкету сейчас. После отправки система предложит
                зарегистрироваться, чтобы вы могли отслеживать статус заявки в личном кабинете.
              </AlertDescription>
            </Alert>
          )}
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
              noValidate
            >
              {fields
                .sort((a, b) => a.order - b.order)
                .map((field) => (
                  <SurveyFieldInput key={field.id} field={field} form={form} />
                ))}

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Отправка..." : "Отправить анкету"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}