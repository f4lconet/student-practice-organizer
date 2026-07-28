import { apiClient } from "./client";
import type { Cohort } from "@/entities/cohort";
import type { SurveyField } from "@/entities/survey-field";
import type { CohortRole } from "@/entities/cohort-role";

// ---- Cohorts ----

export function fetchCohorts(): Promise<Cohort[]> {
  return apiClient.get<Cohort[]>("/admin/cohorts");
}

export function fetchCohort(id: string): Promise<Cohort> {
  return apiClient.get<Cohort>(`/admin/cohorts/${id}`);
}

export function createCohort(data: Omit<Cohort, "id">): Promise<Cohort> {
  return apiClient.post<Cohort>("/admin/cohorts", data);
}

export function updateCohort(id: string, data: Partial<Cohort>): Promise<Cohort> {
  return apiClient.put<Cohort>(`/admin/cohorts/${id}`, data);
}

export function deleteCohort(id: string): Promise<void> {
  return apiClient.delete<void>(`/admin/cohorts/${id}`);
}

export function archiveCohort(id: string): Promise<Cohort> {
  return apiClient.patch<Cohort>(`/admin/cohorts/${id}/archive`);
}

export function unarchiveCohort(id: string): Promise<Cohort> {
  return apiClient.patch<Cohort>(`/admin/cohorts/${id}/unarchive`);
}

/** PUBLIC: Получить активную когорту */
export function fetchActiveCohort(): Promise<Cohort> {
  return apiClient.get<Cohort>("/public/cohorts/active", { skipAuth: true });
}

/** PUBLIC: Получить поля анкеты для когорты */
export function fetchPublicSurveyFields(cohortId: string): Promise<SurveyField[]> {
  return apiClient.get<SurveyField[]>(`/public/cohorts/${cohortId}/survey`, {
    skipAuth: true,
  });
}

// ---- Survey Fields (admin) ----

/** Получить поля анкеты. Используем публичный эндпоинт, так как админского GET-эндпоинта для списка полей нет. */
export function fetchSurveyFields(cohortId: string): Promise<SurveyField[]> {
  return apiClient.get<SurveyField[]>(`/public/cohorts/${cohortId}/survey`);
}

export function createSurveyField(
  cohortId: string,
  data: { label: string; type: "text" | "select"; order: number; options?: string; isRequired?: boolean },
): Promise<SurveyField> {
  return apiClient.post<SurveyField>(`/admin/cohorts/${cohortId}/survey-fields`, data);
}

export function updateSurveyField(
  cohortId: string,
  fieldId: string,
  data: Partial<{ label: string; type: "text" | "select"; order: number; options: string; isRequired: boolean }>,
): Promise<SurveyField> {
  return apiClient.patch<SurveyField>(
    `/admin/cohorts/${cohortId}/survey-fields/${fieldId}`,
    data,
  );
}

export function deleteSurveyField(cohortId: string, fieldId: string): Promise<void> {
  return apiClient.delete<void>(
    `/admin/cohorts/${cohortId}/survey-fields/${fieldId}`,
  );
}

// ---- Cohort Roles ----

export function fetchCohortRoles(cohortId: string): Promise<CohortRole[]> {
  return apiClient.get<CohortRole[]>(`/admin/cohorts/${cohortId}/roles`);
}

export function createCohortRole(
  cohortId: string,
  data: { name: string },
): Promise<CohortRole> {
  return apiClient.post<CohortRole>(`/admin/cohorts/${cohortId}/roles`, data);
}

export function deleteCohortRole(roleId: string): Promise<void> {
  return apiClient.delete<void>(`/admin/cohorts/roles/${roleId}`);
}

// ---- Test Task (admin) ----

export function fetchTestTask(cohortId: string): Promise<{ id: string; content: string; publishedAt: string | null } | null> {
  return apiClient.get(`/admin/cohorts/${cohortId}/test-task`);
}

export function saveTestTask(cohortId: string, content: string): Promise<void> {
  return apiClient.post(`/admin/cohorts/${cohortId}/test-task`, { content });
}

export function publishTestTask(cohortId: string): Promise<void> {
  return apiClient.patch(`/admin/cohorts/${cohortId}/test-task/publish`);
}