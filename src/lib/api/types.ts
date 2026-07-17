export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiRequestConfig extends Omit<RequestInit, "body"> {
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  /** Пропустить автоматическую подстановку JWT */
  skipAuth?: boolean;
  /** Не вызывать обработчик 401 (для случаев, когда 401 — ожидаемое поведение, например проверка сессии) */
  skipUnauthorizedRedirect?: boolean;
  /** Тип ответа. 'blob' — для скачивания бинарных файлов */
  responseType?: "json" | "text" | "blob";
}

export interface ApiClientOptions {
  baseUrl?: string;
  getAccessToken?: () => string | null;
  onUnauthorized?: () => void;
}
