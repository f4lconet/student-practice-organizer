import { apiClient } from "./client";
import type { Cohort } from "@/entities/cohort";
import type { SurveyField } from "@/entities/survey-field";
import type { Application } from "@/entities";

export interface SurveyConfigResponse {
  cohort: Cohort;
  fields: SurveyField[];
}

export interface TestTaskResponse {
  published: boolean;
  content?: string;
}

export interface SubmitApplicationRequest {
  cohortId: string;
  roleId: string;
  answers: { fieldId: string; value: string }[];
}

/**
 * Получить активную когорту (публичный эндпоинт).
 * GET /api/public/cohorts/active
 */
export function fetchPublicActiveCohort() {
  return apiClient.get<Cohort>("/public/cohorts/active", { skipAuth: true });
}

/**
 * Получить поля анкеты для активной когорты (публичный эндпоинт).
 * GET /api/public/cohorts/:id/survey
 */
export function fetchPublicSurveyFields(cohortId: string) {
  return apiClient.get<SurveyField[]>(`/public/cohorts/${cohortId}/survey`, {
    skipAuth: true,
  });
}

/**
 * Подать заявку.
 * POST /api/applications
 * Тело: { cohortId, answers: [{ fieldId, value }] }
 */
export function submitApplication(data: SubmitApplicationRequest) {
  return apiClient.post<Application>("/applications", data);
}