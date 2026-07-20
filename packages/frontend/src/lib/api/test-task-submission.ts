import { apiClient } from "./client";

export interface TestTaskSubmission {
  id: string;
  testTaskId: string;
  applicationId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface TestTaskSubmissionWithApplication extends TestTaskSubmission {
  application: {
    id: string;
    userId: string;
    email?: string;
    user: {
      id: string;
      email: string;
      role: string;
    };
    fieldValues: Array<{
      id: string;
      value: string;
      field: {
        id: string;
        label: string;
        type: string;
        order: number;
      };
    }>;
  };
}

/**
 * Отправить решение тестового задания
 * POST /api/applications/:applicationId/test-task/submit
 */
export function submitTestTaskSolution(
  applicationId: string,
  content: string,
): Promise<TestTaskSubmission> {
  return apiClient.post<TestTaskSubmission>(
    `/applications/${applicationId}/test-task/submit`,
    { content },
  );
}

/**
 * Получить своё решение тестового задания
 * GET /api/applications/:applicationId/test-task/submission
 */
export function fetchMyTestTaskSubmission(
  applicationId: string,
): Promise<{ submission: TestTaskSubmission | null }> {
  return apiClient.get<{ submission: TestTaskSubmission | null }>(
    `/applications/${applicationId}/test-task/submission`,
  );
}

/**
 * Получить все решения тестового задания по когорте (админ)
 * GET /api/admin/cohorts/:cohortId/test-task/submissions
 */
export function fetchAdminTestTaskSubmissions(
  cohortId: string,
): Promise<TestTaskSubmissionWithApplication[]> {
  return apiClient.get<TestTaskSubmissionWithApplication[]>(
    `/admin/cohorts/${cohortId}/test-task/submissions`,
  );
}