"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { saveTestTask, publishTestTask } from "@/lib/api/cohorts";
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

interface TestTaskTabProps {
  cohortId: string;
}

export function TestTaskTab({ cohortId }: TestTaskTabProps) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [isContentDirty, setIsContentDirty] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const saveMutation = useMutation({
    mutationFn: (newContent: string) =>
      saveTestTask(cohortId, newContent),
    onSuccess: () => {
      setIsContentDirty(false);
      setSaveError(null);
      setIsLoading(false);
    },
    onError: () => {
      setSaveError("Ошибка при сохранении содержимого");
      setIsLoading(false);
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => publishTestTask(cohortId),
    onSuccess: () => {
      setIsPublished(true);
      queryClient.invalidateQueries({ queryKey: ["test-task", cohortId] });
    },
    onError: () => {
      setSaveError("Ошибка при публикации тестового задания");
    },
  });

  const handleSave = () => {
    if (content.trim().length === 0) return;
    setSaveError(null);
    setIsLoading(true);
    saveMutation.mutate(content);
  };

  const handlePublish = () => {
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

      {isLoading && (
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
              onChange={(e) => {
                setContent(e.target.value);
                setIsContentDirty(true);
              }}
              placeholder="## Тестовое задание

Реализуйте ..."
              rows={16}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending || !isContentDirty}
            >
              <Save className="mr-2 h-4 w-4" />
              {saveMutation.isPending ? "Сохранение..." : "Сохранить"}
            </Button>

            {!isPublished && (
              <Button
                variant="default"
                onClick={handlePublish}
                disabled={publishMutation.isPending || !content}
              >
                <Send className="mr-2 h-4 w-4" />
                {publishMutation.isPending
                  ? "Публикация..."
                  : "Опубликовать"}
              </Button>
            )}
          </div>

          {isContentDirty && !saveMutation.isPending && (
            <p className="text-xs text-amber-600">
              Есть несохранённые изменения. Нажмите «Сохранить» перед
              публикацией.
            </p>
          )}
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