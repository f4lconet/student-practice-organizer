"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { TaskCard } from "@/entities";

const taskSchema = z.object({
  title: z.string().min(1, "Введите название задачи"),
  description: z.string().min(1, "Введите описание"),
  artifactLink: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^https?:\/\/.+/i.test(val),
      "Введите корректный URL (начинается с http:// или https://)",
    ),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskCard | null;
  date: string | null;
  readOnly?: boolean;
  participantName?: string;
  participantRole?: string;
  onSave: (data: { title: string; description: string; artifactLink: string | null }) => void;
  onDelete?: (id: string) => void;
}

export function TaskCardDialog({
  open,
  onOpenChange,
  task,
  date,
  readOnly = false,
  participantName,
  participantRole,
  onSave,
  onDelete,
}: TaskCardDialogProps) {
  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      artifactLink: task?.artifactLink ?? "",
    },
  });

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  const onSubmit = (data: TaskFormData) => {
    onSave({
      title: data.title,
      description: data.description,
      artifactLink: data.artifactLink || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {readOnly
              ? "Карточка задачи"
              : task
                ? "Редактировать задачу"
                : "Новая задача"}
          </DialogTitle>
          <DialogDescription>
            {readOnly && participantName && participantRole
              ? `${participantName} — ${participantRole}`
              : date
                ? new Date(date).toLocaleDateString("ru-RU", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })
                : ""}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="task-title" className="mb-1.5 block text-sm font-medium">
                Название задачи
              </Label>
              <Input
                id="task-title"
                placeholder="Краткое название"
                {...form.register("title")}
                readOnly={readOnly}
                disabled={readOnly}
              />
              {form.formState.errors.title && (
                <p className="mt-1 text-xs text-destructive">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="task-desc" className="mb-1.5 block text-sm font-medium">
                Что было сделано
              </Label>
              <Textarea
                id="task-desc"
                placeholder="Опишите, что сделано..."
                className="min-h-[100px] resize-y"
                {...form.register("description")}
                readOnly={readOnly}
                disabled={readOnly}
              />
              {form.formState.errors.description && (
                <p className="mt-1 text-xs text-destructive">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="task-link" className="mb-1.5 block text-sm font-medium">
                Ссылка на артефакт
              </Label>
              <Input
                id="task-link"
                type="url"
                placeholder="https://github.com/..."
                {...form.register("artifactLink")}
                readOnly={readOnly}
                disabled={readOnly}
              />
              {form.formState.errors.artifactLink && (
                <p className="mt-1 text-xs text-destructive">
                  {form.formState.errors.artifactLink.message}
                </p>
              )}
            </div>

            {task && task.updatedAt && (
              <p className="text-xs text-muted-foreground">
                Обновлено:{" "}
                {formatDistanceToNow(new Date(task.updatedAt), {
                  addSuffix: true,
                  locale: ru,
                })}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              {readOnly ? "Закрыть" : "Отмена"}
            </Button>
            {!readOnly && (
              <>
                {task && onDelete && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => onDelete(task.id)}
                  >
                    Удалить
                  </Button>
                )}
                <Button type="submit">
                  {task ? "Сохранить" : "Создать"}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}