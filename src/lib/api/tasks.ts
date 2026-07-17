import { apiClient } from "./client";
import type { TaskCard } from "@/entities";

export interface WeekGridResponse {
  weekStart: string;
  cohortName: string;
  workdays: {
    date: string;
    tasks: TaskCard[];
  }[];
}

export interface TaskCardPayload {
  cohortId: string;
  date: string;
  title: string;
  description?: string;
  artifactLink?: string;
}

/**
 * Получить сетку задач на неделю.
 * GET /api/tasks?cohortId=...&weekStart=...&all=...
 */
export function fetchTasks(params: {
  cohortId: string;
  weekStart: string;
  all?: boolean;
}) {
  return apiClient.get<WeekGridResponse>("/tasks", {
    params: {
      cohortId: params.cohortId,
      weekStart: params.weekStart,
      all: params.all ? "true" : undefined,
    },
  });
}

/**
 * Создать новую задачу.
 * POST /api/tasks
 */
export function createTask(data: TaskCardPayload) {
  return apiClient.post<TaskCard>("/tasks", data);
}

/**
 * Обновить задачу.
 * PATCH /api/tasks/:id
 */
export function updateTask(id: string, data: Partial<Pick<TaskCard, "title" | "description" | "artifactLink">>) {
  return apiClient.patch<TaskCard>(`/tasks/${id}`, data);
}

/**
 * Удалить задачу.
 * DELETE /api/tasks/:id
 */
export function deleteTask(id: string): Promise<void> {
  return apiClient.delete<void>(`/tasks/${id}`);
}

// ---- Admin ----

/**
 * Получить сводку по задачам практикантов когорты.
 * GET /api/admin/cohorts/:cohortId/tasks-overview
 */
export function fetchAdminTasksOverview(cohortId: string) {
  return apiClient.get<unknown>(`/admin/cohorts/${cohortId}/tasks-overview`);
}