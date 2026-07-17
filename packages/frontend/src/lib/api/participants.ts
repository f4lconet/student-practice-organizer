import { apiClient } from "./client";
import type { CohortParticipant } from "@/entities";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Получить список участников (практикантов) когорты.
 *
 * Использует комбинацию эндпоинтов:
 * - GET /admin/cohorts/:cohortId/applications — заявки с userId, user.email, fieldValues (ФИО)
 * - GET /admin/cohorts/:cohortId/documents-overview — сводка с userName (но может быть пустым)
 */
export async function fetchCohortParticipants(cohortId: string): Promise<CohortParticipant[]> {
  // 1. Берём одобренные заявки — это все участники когорты.
  //    API может вернуть как массив, так и объект { applications: [...] }
  const rawApps: any = await apiClient.get<any>(
    `/admin/cohorts/${cohortId}/applications`,
  );

  const applications: any[] = Array.isArray(rawApps)
    ? rawApps
    : rawApps?.applications ?? [];

  if (!Array.isArray(applications) || applications.length === 0) {
    return [];
  }

  // 2. Пробуем достать имена из documents-overview (там есть userName)
  let overviewStudents: Array<{ userId: string; userName: string }> = [];

  try {
    const rawOverview: any = await apiClient.get<any>(
      `/admin/cohorts/${cohortId}/documents-overview`,
    );
    const items = Array.isArray(rawOverview) ? rawOverview : rawOverview?.students ?? [];
    overviewStudents = items as Array<{ userId: string; userName: string }>;
  } catch {
    // overview может вернуть 404 — не страшно
  }

  const nameMap = new Map<string, string>();
  for (const item of overviewStudents) {
    if (item?.userName && item?.userId) {
      nameMap.set(String(item.userId), String(item.userName));
    }
  }

  // 3. Собираем participants
  const participants: CohortParticipant[] = [];

  for (const app of applications) {
    if (app?.status !== "approved") continue;

    const userId = String(app?.userId ?? app?.user?.id ?? "");
    if (!userId) continue;

    // Пробуем найти имя в nameMap
    let userName = nameMap.get(userId) ?? "";

    // Если нет — ищем в fieldValues поле "ФИО"
    if (!userName && Array.isArray(app?.fieldValues)) {
      for (const fv of app.fieldValues) {
        const field = fv?.field;
        if (field && typeof field.label === "string" && field.label.toLowerCase() === "фио" && fv.value) {
          userName = String(fv.value);
          break;
        }
      }
    }

    // Если всё ещё нет — берём email
    if (!userName) {
      userName = String(app?.user?.email ?? "Без имени");
    }

    participants.push({ userId, userName });
  }

  return participants;
}