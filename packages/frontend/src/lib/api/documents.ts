import { apiClient } from "./client";

export interface StudentDocumentData {
  id: string;
  userId: string;
  cohortId: string;
  studentFio: string | null;
  group: string | null;
  directionCode: string | null;
  directionName: string | null;
  programName: string | null;
  specialty: string | null;
  practiceTopic: string | null;
  mainStageTasks: string | null;
  reviewActivities: string | null;
  reviewCharacteristic: string | null;
  reviewEmployed: string | null;
  reviewNextPractice: string | null;
  reviewEmploymentOffer: string | null;
  reviewSuggestions: string | null;
  reviewGrade: string | null;
  reportFileUrl: string | null;
  reportAdminApproved: boolean;
}

/** Ответ от бэкенда: один студент */
export interface AdminStudentDocumentInfo {
  userId: string;
  userEmail: string;
  /** ФИО — пытаемся извлечь из userEmail или поля анкеты */
  userName: string;
  /** Загружен ли отчёт */
  reportUploaded: boolean;
  /** Статус отчёта */
  reportStatus: string;
  /** Статус ИЗ */
  individualTaskStatus: string;
  /** Статус отзыва */
  reviewStatus: string;
  /** Статус титульного листа */
  titlePageStatus: string;
  /** Заполнены ли поля ИЗ студентом */
  individualTaskFieldsFilled: boolean;
  /** ИЗ готово к формированию */
  individualTaskReady: boolean;
  /** Заполнены ли поля отзыва администратором */
  reviewFieldsFilled: boolean;
  /** Отзыв готов к формированию */
  reviewReady: boolean;
  /** Заполнены ли поля титульного листа */
  titlePageFieldsFilled: boolean;
  /** Титульный лист готов к формированию */
  titlePageReady: boolean;
  /** Существует ли запись документов */
  docExists: boolean;
  /** Статус заявки */
  status: string;
  /** ID роли */
  roleId: string;
  /** URL файла отчёта (если есть) */
  reportFileUrl: string | null;
  /** Одобрен ли отчёт администратором */
  reportAdminApproved: boolean;
}

export interface AdminDocumentsOverviewResponse {
  cohortId: string;
  cohortName: string;
  totalApproved: number;
  students: AdminStudentDocumentInfo[];
}

// ---- Student-facing API ----

/**
 * Получить или создать документы для заявки.
 * GET /api/documents/my?applicationId=...&cohortId=...
 */
export function fetchMyDocuments(applicationId: string, cohortId: string) {
  return apiClient.get<StudentDocumentData>("/documents/my", {
    params: { applicationId, cohortId },
  });
}

/**
 * Обновить поля документов.
 * PATCH /api/documents/my?cohortId=...
 */
export function updateMyDocuments(cohortId: string, data: Partial<StudentDocumentData>) {
  return apiClient.patch<StudentDocumentData>(`/documents/my?cohortId=${cohortId}`, data);
}

/**
 * Загрузить отчёт.
 * POST /api/documents/my/report?cohortId=...
 */
export function uploadReport(cohortId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient.post<{ fileUrl: string }>(
    `/documents/my/report?cohortId=${cohortId}`,
    formData,
    { headers: {} },
  );
}

/**
 * Сгенерировать документ.
 * GET /api/documents/my/:type/generate?cohortId=...
 * Ответ — бинарный .docx файл.
 */
export function generateDocument(type: "individual-task" | "title-page" | "review", cohortId: string) {
  return apiClient.get<Blob>(`/documents/my/${type}/generate?cohortId=${cohortId}`, {
    skipAuth: false,
  });
}

// ---- Admin API ----

/**
 * Получить сводку по документам практикантов когорты.
 * GET /api/admin/cohorts/:cohortId/documents-overview
 */
export function fetchAdminDocumentsOverview(cohortId: string): Promise<AdminStudentDocumentInfo[]> {
  return apiClient.get<AdminDocumentsOverviewResponse | AdminStudentDocumentInfo[]>(
    `/admin/cohorts/${cohortId}/documents-overview`,
  ).then((data) => {
    if (Array.isArray(data)) {
      return data;
    }
    return data?.students ?? [];
  });
}

/**
 * Заполнить отзыв (админ).
 * PATCH /api/admin/documents/:userId/:cohortId/review
 * Тело запроса: review_* поля (см. IMPORTANT — тело не описано в спецификации)
 */
export function saveAdminReview(
  userId: string,
  cohortId: string,
  data: {
    reviewActivities?: string;
    reviewCharacteristic?: string;
    reviewEmployed?: string;
    reviewNextPractice?: string;
    reviewEmploymentOffer?: string;
    reviewSuggestions?: string;
    reviewGrade?: string;
  },
): Promise<void> {
  return apiClient.patch<void>(
    `/admin/documents/${userId}/${cohortId}/review`,
    data,
  );
}

/**
 * Подтвердить отчёт (админ).
 * PATCH /api/admin/documents/:userId/:cohortId/approve-report
 */
export function approveReport(
  userId: string,
  cohortId: string,
  approved: boolean,
): Promise<void> {
  return apiClient.patch<void>(
    `/admin/documents/${userId}/${cohortId}/approve-report`,
    { approved },
  );
}

/**
 * Скачать файл отчёта через API с авторизацией.
 * GET /api/documents/my/report/download
 */
export function downloadReportFile(fileUrl: string): Promise<Blob> {
  const url = fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`;
  return apiClient.get<Blob>(url, {
    responseType: "blob",
  });
}
