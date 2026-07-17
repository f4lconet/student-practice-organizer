import { apiClient } from "./client";
import type { Application } from "@/entities";

export interface DashboardResponse {
  applications: Application[];
  tasksTabAvailable: boolean;
}

/**
 * Получить данные личного кабинета.
 * GET /api/dashboard
 */
export function fetchDashboard() {
  return apiClient.get<DashboardResponse>("/dashboard");
}