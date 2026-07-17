"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { verifyEmail } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    !token ? "error" : "loading",
  );
  const [errorMessage, setErrorMessage] = useState(
    !token ? "Токен подтверждения не найден в ссылке." : "",
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    verifyEmail(token)
      .then((response) => {
        setStatus("success");
        // После успешного подтверждения можно авторизоваться
        // Токен из подтверждения не является сессионным
      })
      .catch(() => {
        setStatus("error");
        setErrorMessage(
          "Не удалось подтвердить email. Возможно, срок действия ссылки истёк.",
        );
      });
  }, [token]);

  return (
    <main className="container mx-auto flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            {status === "loading" && "Подтверждение email"}
            {status === "success" && "Email подтверждён!"}
            {status === "error" && "Ошибка подтверждения"}
          </CardTitle>
          <CardDescription>
            {status === "loading" && "Проверяем токен подтверждения..."}
            {status === "success" &&
              "Ваш email успешно подтверждён. Теперь вы можете войти в систему."}
            {status === "error" && errorMessage}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "loading" && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {status === "success" && (
            <div className="flex justify-center py-4">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
          )}

          {status === "error" && (
            <div className="flex justify-center py-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
          )}

          <Button
            className="w-full"
            onClick={() => router.push("/login")}
          >
            Перейти к входу
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <main className="container mx-auto flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Подтверждение email</CardTitle>
            <CardDescription>Загрузка...</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </main>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
