/**
 * Стратегия хранения JWT.
 *
 * Бэкенд возвращает токен в теле ответа (поле token).
 * Токен живёт ~неделю — храним его в localStorage, чтобы сохранять
 * авторизацию между перезагрузками страницы.
 *
 * Поверх localStorage держим in-memory-копию для быстрого доступа.
 * При инициализации модуля читаем сохранённый токен из localStorage.
 */

const STORAGE_KEY = "access_token";

export type TokenStrategy = "local-storage";

let inMemoryToken: string | null = null;

/** Загрузить токен из localStorage при первом импорте модуля */
function initializeToken(): void {
  if (typeof window !== "undefined" && inMemoryToken === null) {
    try {
      inMemoryToken = localStorage.getItem(STORAGE_KEY);
    } catch {
      inMemoryToken = null;
    }
  }
}

// Инициализируем токен сразу при импорте модуля
initializeToken();

export function getTokenStrategy(): TokenStrategy {
  return "local-storage";
}

/**
 * Получить токен.
 * Сначала проверяет in-memory, при отсутствии — загружает из localStorage.
 */
export function getAccessToken(): string | null {
  if (inMemoryToken === null) {
    initializeToken();
  }
  return inMemoryToken;
}

/**
 * Сохранить токен — и в память, и в localStorage.
 */
export function setAccessToken(token: string | null) {
  inMemoryToken = token;
  if (typeof window !== "undefined") {
    try {
      if (token) {
        localStorage.setItem(STORAGE_KEY, token);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // localStorage недоступен — продолжаем с in-memory
    }
  }
}

/**
 * Очистить токен — из памяти и из localStorage.
 */
export function clearAccessToken() {
  inMemoryToken = null;
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage недоступен
    }
  }
}
