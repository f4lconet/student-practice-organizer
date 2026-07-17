import { ApiError, type ApiClientOptions, type ApiRequestConfig } from "./types";
import { getAccessToken } from "./token-strategy";

const DEFAULT_BASE_URL = "/api";

let accessTokenGetter: (() => string | null) | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setAccessTokenGetter(getter: () => string | null) {
  accessTokenGetter = getter;
}

export function setUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler;
}

/**
 * Получить токен из зарегистрированного getter'а или из стратегии хранения.
 */
function resolveAccessToken(): string | null {
  if (accessTokenGetter) {
    return accessTokenGetter();
  }
  return getAccessToken();
}

function buildUrl(
  path: string,
  params?: ApiRequestConfig["params"],
  baseUrl = DEFAULT_BASE_URL,
): string {
  const isAbsolute = path.startsWith("http");
  let url = isAbsolute ? path : `${baseUrl}${path}`;

  if (params) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        search.set(key, String(value));
      }
    }
    const qs = search.toString();
    if (qs) url += (url.includes("?") ? "&" : "?") + qs;
  }

  return url;
}

function buildHeaders(
  config: ApiRequestConfig,
  hasBody: boolean,
  isFormData?: boolean,
): Headers {
  const headers = new Headers(config.headers);

  if (hasBody && !headers.has("Content-Type") && !isFormData) {
    headers.set("Content-Type", "application/json");
  }

  if (!config.skipAuth) {
    const token = resolveAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  return headers;
}

async function parseResponseBody(response: Response, responseType?: "json" | "text" | "blob"): Promise<unknown> {
  if (responseType === "blob") {
    return response.blob();
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  if (response.status === 204) {
    return null;
  }

  return response.text();
}

export async function apiRequest<T>(
  path: string,
  config: ApiRequestConfig = {},
  options: ApiClientOptions = {},
): Promise<T> {
  const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
  const hasBody = config.body !== undefined;
  const isFormData = config.body instanceof FormData;
  const url = buildUrl(path, config.params, baseUrl);

  const fetchInit: RequestInit = {
    method: config.method,
    headers: buildHeaders(config, hasBody, isFormData),
    body: undefined,
    ...("body" in config ? {} : {}),
  };

  if (hasBody) {
    fetchInit.body = isFormData ? (config.body as FormData) : JSON.stringify(config.body);
  }

  const response = await fetch(url, fetchInit);

  const body = await parseResponseBody(response, config.responseType);

  if (
    response.status === 401 &&
    !config.skipUnauthorizedRedirect &&
    unauthorizedHandler
  ) {
    unauthorizedHandler();
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    if (typeof body === "object" && body !== null) {
      const errBody = body as Record<string, unknown>;
      // Формат: { error: { message, code } }
      if (errBody.error && typeof errBody.error === "object") {
        const err = errBody.error as Record<string, unknown>;
        if (typeof err.message === "string") {
          message = err.message;
        }
      } else if (typeof errBody.message === "string") {
        // Формат: { message }
        message = errBody.message;
      }
    }

    throw new ApiError(message, response.status, body);
  }

  return body as T;
}

export const apiClient = {
  get<T>(path: string, config?: Omit<ApiRequestConfig, "method" | "body">) {
    return apiRequest<T>(path, { ...config, method: "GET" });
  },

  post<T>(
    path: string,
    body?: unknown,
    config?: Omit<ApiRequestConfig, "method" | "body">,
  ) {
    return apiRequest<T>(path, { ...config, method: "POST", body });
  },

  put<T>(
    path: string,
    body?: unknown,
    config?: Omit<ApiRequestConfig, "method" | "body">,
  ) {
    return apiRequest<T>(path, { ...config, method: "PUT", body });
  },

  patch<T>(
    path: string,
    body?: unknown,
    config?: Omit<ApiRequestConfig, "method" | "body">,
  ) {
    return apiRequest<T>(path, { ...config, method: "PATCH", body });
  },

  delete<T>(path: string, config?: Omit<ApiRequestConfig, "method" | "body">) {
    return apiRequest<T>(path, { ...config, method: "DELETE" });
  },
};

export { DEFAULT_BASE_URL };
