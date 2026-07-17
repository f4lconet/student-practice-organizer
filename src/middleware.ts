import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type UserRole = "PRACTICANT" | "ADMIN";

/**
 * Временная заглушка для middleware — JWT хранится in-memory на клиенте.
 * Middleware не может проверить JWT без бэкенд-запроса или httpOnly cookie.
 *
 * Пока что пропускаем все запросы. Серверная проверка авторизации
 * реализуется через API-клиент на клиенте.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Публичные пути — пропускаем всегда
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/survey") ||
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/verify-email" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password"
  ) {
    return NextResponse.next();
  }

  // Защищённые маршруты клиентской стороны проверяются через AuthProvider
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};