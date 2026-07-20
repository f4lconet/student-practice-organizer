"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useState, useMemo } from "react";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";
import { fetchPublicAcceptingCohorts, fetchPublicSurveyFields, submitApplication } from "@/lib/api/survey";
import type { SurveyConfigResponse } from "@/lib/api/survey";
import type { Application } from "@/entities";
import type { TestTask } from "@/entities/test-task";
import type { Cohort } from "@/entities/cohort";

interface UseSurveyPageOptions {
  prefillData?: Record<string, string> | null;
}

/**
 * Хук для страницы анкеты /survey/[cohortSlug].
 */
export function useSurveyPage(slug: string, options?: UseSurveyPageOptions) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [selectedCohortId, setSelectedCohortId] = useState<string | null>(null);

  // 1. Получаем список когорт, принимающих заявки
  const acceptingCohortsQuery = useQuery({
    queryKey: ["public", "accepting-cohorts"],
    queryFn: () => fetchPublicAcceptingCohorts().catch(() => []),
    retry: 0,
    staleTime: 5 * 60 * 1000,
  });

  const acceptingCohorts: Cohort[] = acceptingCohortsQuery.data ?? [];

  // 2. Вычисляем когорту по умолчанию при загрузке списка
  const defaultCohortId = useMemo(() => {
    if (acceptingCohorts.length === 0) return null;
    if (slug !== "current") {
      const slugCohort = acceptingCohorts.find((c) => c.name === slug);
      if (slugCohort) return slugCohort.id;
    }
    return acceptingCohorts[0].id;
  }, [acceptingCohorts, slug]);

  // Эффективный ID когорты: выбранная пользователем или по умолчанию
  const effectiveCohortId = selectedCohortId ?? defaultCohortId;
  const cohort: Cohort | null = acceptingCohorts.find((c) => c.id === effectiveCohortId) ?? null;

  // 3. Загружаем поля анкеты для выбранной когорты
  const fieldsQuery = useQuery({
    queryKey: ["public", "survey-fields", effectiveCohortId],
    queryFn: () => fetchPublicSurveyFields(effectiveCohortId!),
    enabled: !!effectiveCohortId,
    staleTime: 5 * 60 * 1000,
  });

  const fields = fieldsQuery.data ?? [];

  // 4. Отправка заявки
  const submitMutation = useMutation({
    mutationFn: (data: Record<string, string>) => {
      if (!cohort) throw new Error("Нет активной когорты");
      const answers = Object.entries(data).map(([fieldId, value]) => ({
        fieldId,
        value,
      }));
      return submitApplication({ cohortId: cohort.id, roleId: "", answers });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Анкета успешно отправлена!");

      // Если пользователь не авторизован — перенаправляем на регистрацию
      if (!isAuthenticated) {
        setTimeout(() => {
          router.push("/register");
        }, 2000);
      }
    },
    onError: (error: Error) => {
      // Если ошибка 401 (не авторизован) — перенаправляем на регистрацию без предупреждения
      if (error.message?.includes("401") || error.message?.includes("Unauthorized")) {
        setTimeout(() => {
          router.push("/register");
        }, 1000);
      } else {
        toast.error(error.message ?? "Ошибка при отправке анкеты");
      }
    },
  });

  const isSubmitted = submitMutation.isSuccess;

  const handleSubmit = useCallback(
    (data: Record<string, string>) => {
      submitMutation.mutate(data);
    },
    [submitMutation],
  );

  const handleBackToHome = useCallback(() => {
    router.push("/");
  }, [router]);

  const handleBackToApplications = useCallback(() => {
    router.push("/applications");
  }, [router]);

  const isLoadingConfig = acceptingCohortsQuery.isLoading || fieldsQuery.isLoading;
  const configError = acceptingCohortsQuery.error ?? fieldsQuery.error;
  const isFieldsEmpty = fields.length === 0;

  return {
    fields,
    cohort,
    acceptingCohorts,
    effectiveCohortId,
    setSelectedCohortId,
    isLoadingConfig,
    configError,
    isFieldsEmpty,
    isApplicationPeriodActive: !cohort ? null : isWithinDates(cohort.applicationStart, cohort.applicationEnd),
    isSubmitting: submitMutation.isPending,
    isSubmitted,
    submitError: submitMutation.error,
    handleSubmit,
    testTask: null as TestTask | null,
    isLoadingTestTask: false,
    testTaskError: null,
    handleBackToHome,
    handleBackToApplications,
  };
}

function isWithinDates(start: string, end: string): boolean {
  const now = Date.now();
  // applicationEnd хранится как начало дня (00:00:00.000 UTC),
  // поэтому весь день окончания приёма должен быть включён.
  // Сравниваем с началом сегодняшнего дня в UTC.
  const nowDate = new Date();
  const startOfTodayUTC = Date.UTC(
    nowDate.getUTCFullYear(),
    nowDate.getUTCMonth(),
    nowDate.getUTCDate(),
    0, 0, 0, 0,
  );
  return now >= new Date(start).getTime() && startOfTodayUTC <= new Date(end).getTime();
}
