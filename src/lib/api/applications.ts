import { apiClient } from "./client";
import type { Application } from "@/entities";
import type { SurveyField } from "@/entities/survey-field";

export interface PrefillDataResponse {
  data: Record<string, string>;
}

export interface AdminApplication {
  id: string;
  userId: string;
  cohortId: string;
  status: string;
  roleId: string | null;
  reviewComment: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    role: "ADMIN" | "PRACTICANT";
  };
  fieldValues: Array<{
    id: string;
    applicationId: string;
    fieldId: string;
    value: string;
    field: {
      id: string;
      cohortId: string;
      label: string;
      type: "text" | "select";
      options: string | null;
      order: number;
      isRequired: boolean;
    };
  }>;
}

/** Заявка с ответами на поля анкеты — то, что приходит с бэкенда в /api/applications/my */
export interface ApplicationWithFieldValues extends Application {
  fieldValues: AdminApplication["fieldValues"];
}

/**
 * Получить список своих заявок.
 * GET /api/applications/my
 */
export function fetchMyApplications(): Promise<ApplicationWithFieldValues[]> {
  return apiClient.get<ApplicationWithFieldValues[]>("/applications/my");
}

/**
 * Получить prefill-данные из последней заявки для повторной подачи.
 * GET /api/applications/prefill
 */
export function fetchPrefillData(): Promise<PrefillDataResponse> {
  return apiClient.get<PrefillDataResponse>("/applications/prefill");
}

/**
 * Получить тестовое задание для заявки.
 * GET /api/applications/{id}/test-task
 */
export function fetchApplicationTestTask(id: string): Promise<{ published: boolean; content?: string }> {
  return apiClient.get<{ published: boolean; content?: string }>(`/applications/${id}/test-task`);
}

// ---- Admin API ----

/**
 * Получить список заявок для когорты (админ).
 * GET /api/admin/cohorts/:cohortId/applications
 */
export function fetchAdminApplications(
  cohortId: string,
): Promise<AdminApplication[]> {
  return apiClient.get<AdminApplication[]>(
    `/admin/cohorts/${cohortId}/applications`,
  );
}

/**
 * Одобрить заявку с назначением роли.
 * PATCH /api/admin/applications/:id/approve
 */
export function approveApplication(
  applicationId: string,
  roleId: string,
): Promise<Application> {
  return apiClient.patch<Application>(
    `/admin/applications/${applicationId}/approve`,
    { roleId },
  );
}

/**
 * Отклонить заявку с комментарием.
 * PATCH /api/admin/applications/:id/reject
 */
export function rejectApplication(
  applicationId: string,
  reviewComment: string,
): Promise<Application> {
  return apiClient.patch<Application>(
    `/admin/applications/${applicationId}/reject`,
    { reviewComment },
  );
}