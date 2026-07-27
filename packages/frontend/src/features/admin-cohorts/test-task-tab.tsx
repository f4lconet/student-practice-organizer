"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { fetchTestTask, saveTestTask, publishTestTask } from "@/lib/api/cohorts";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Send, Save, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

interface TestTaskTabProps {
  cohortId: string;
}

export function TestTaskTab({ cohortId }: TestTaskTabProps) {
  const queryClient = useQueryClient();
  const [localContent, setLocalContent] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data, isLoading: isFetching } = useQuery({
    queryKey: ["test-task", cohortId],
    queryFn: () => fetchTestTask(cohortId),
    refetchOnMount: "always",
    staleTime: 0,
  });

  // Если localContent === null — используем данные с сервера
  const content = localContent !== null ? localContent : (data?.content ?? "");
  const isPublished = data?.publishedAt !== null && data !== null;

  const saveMutation = useMutation({
    mutationFn: (newContent: string) =>
      saveTestTask(cohortId, newContent),
    onSuccess: () => {
      setSaveError(null);
      setLocalContent(null);
      queryClient.invalidateQueries({ queryKey: ["test-task", cohortId] });
      toast.success("Тестовое задание успешно сохранено");
    },
    onError: (err: Error) => {
      setSaveError(err.message || "Ошибка при сохранении");
      toast.error("Ошибка при сохранении тестового задания");
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => publishTestTask(cohortId),
    onSuccess: () => {
      setLocalContent(null);
      queryClient.invalidateQueries({ queryKey: ["test-task", cohortId] });
      toast.success("Тестовое задание успешно опубликовано");
    },
    onError: (err: Error) => {
      setSaveError(err.message || "Ошибка при публикации");
      toast.error("Ошибка при публикации тестового задания");
    },
  });

  const handleSave = () => {
    if (!content.trim()) return;
    setSaveError(null);
    saveMutation.mutate(content);
  };

  const handlePublish = () => {
    if (!content.trim()) return;
    setSaveError(null);
    publishMutation.mutate();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Тестовое задание</h3>
          <p className="text-sm text-muted-foreground">
            Редактируйте содержимое тестового задания. После публикации задание
            станет доступно кандидатам, подавшим анкету.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isPublished ? (
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Опубликовано
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" />
              Черновик
            </Badge>
          )}
        </div>
      </div>

      {isFetching && (
        <p className="text-xs text-muted-foreground">Загрузка...</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Содержимое задания</CardTitle>
          <CardDescription>
            Используйте Markdown-разметку для форматирования текста
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-task-content">Текст задания</Label>
            <Textarea
              id="test-task-content"
              value={content}
              onChange={(e) => setLocalContent(e.target.value)}
              placeholder="## Тестовое задание

Реализуйте ..."
              rows={16}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              {saveMutation.isPending ? "Сохранение..." : "Сохранить"}
            </Button>

            <Button
              variant={isPublished ? "secondary" : "default"}
              onClick={handlePublish}
              disabled={publishMutation.isPending}
            >
              <Send className="mr-2 h-4 w-4" />
              {publishMutation.isPending
                ? "Публикация..."
                : isPublished
                  ? "Переопубликовать"
                  : "Опубликовать"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {saveError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}