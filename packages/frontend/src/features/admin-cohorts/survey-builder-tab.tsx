"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  fetchSurveyFields,
  createSurveyField,
  updateSurveyField,
  deleteSurveyField,
} from "@/lib/api/cohorts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  GripVertical,
  AlertCircle,
  Pencil,
} from "lucide-react";
import type { SurveyField, SurveyFieldType } from "@/entities/survey-field";

interface SurveyBuilderTabProps {
  cohortId: string;
}

export function SurveyBuilderTab({ cohortId }: SurveyBuilderTabProps) {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingField, setEditingField] = useState<SurveyField | null>(null);

  const {
    data: fields,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["survey-fields", cohortId],
    queryFn: () => fetchSurveyFields(cohortId),
  });

  const deleteMutation = useMutation({
    mutationFn: (fieldId: string) => deleteSurveyField(cohortId, fieldId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["survey-fields", cohortId] });
    },
  });

  // Переупорядочивание через удаление и создание — временное решение,
  // пока бэкенд не поддерживает PATCH reorder
  const reorderMutation = useMutation({
    mutationFn: async (fieldIds: string[]) => {
      if (!fields) return;
      for (let i = 0; i < fieldIds.length; i++) {
        await updateSurveyField(cohortId, fieldIds[i], { order: i });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["survey-fields", cohortId] });
    },
  });

  const handleMoveUp = (index: number) => {
    if (!fields || index === 0) return;
    const newIds = fields.map((f) => f.id);
    [newIds[index - 1], newIds[index]] = [newIds[index], newIds[index - 1]];
    reorderMutation.mutate(newIds);
  };

  const handleMoveDown = (index: number) => {
    if (!fields || index >= fields.length - 1) return;
    const newIds = fields.map((f) => f.id);
    [newIds[index], newIds[index + 1]] = [newIds[index + 1], newIds[index]];
    reorderMutation.mutate(newIds);
  };

  const handleDelete = (fieldId: string) => {
    deleteMutation.mutate(fieldId);
  };

  const sortedFields = fields
    ? [...fields].sort((a, b) => a.order - b.order)
    : [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Ошибка загрузки полей анкеты
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Поля анкеты</h3>
          <p className="text-sm text-muted-foreground">
            Добавьте поля для формы подачи заявки. Порядок полей можно изменить
            кнопками вверх/вниз.
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить поле
        </Button>
      </div>

      {!sortedFields || sortedFields.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Нет полей</CardTitle>
            <CardDescription>
              Добавьте хотя бы одно поле в анкету
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-2">
          {sortedFields.map((field, index) => (
            <Card key={field.id} className="relative">
              <CardContent className="flex items-center gap-3 py-3">
                <div className="flex flex-col gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === sortedFields.length - 1}
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {field.order}.
                    </span>
                    <span className="font-medium truncate">{field.label}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {field.type === "text" ? "Текст" : "Список"}
                    </span>
                    {field.options && (
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                        ({field.options})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setEditingField(field)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleDelete(field.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <FieldFormDialog
        cohortId={cohortId}
        open={showAddDialog || editingField !== null}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setEditingField(null);
          }
        }}
        field={editingField}
      />
    </div>
  );
}

function FieldFormDialog({
  cohortId,
  open,
  onOpenChange,
  field,
}: {
  cohortId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field: SurveyField | null;
}) {
  const queryClient = useQueryClient();
  const isEditing = field !== null;

  const [label, setLabel] = useState(field?.label ?? "");
  const [type, setType] = useState<SurveyFieldType>(field?.type ?? "text");
  const [optionsText, setOptionsText] = useState(
    field?.options ?? "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!label.trim()) {
      setError("Название поля обязательно");
      return;
    }

    const optionsString =
      type === "select"
        ? optionsText
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)
            .join(",")
        : undefined;

    if (type === "select" && (!optionsString || optionsString.length === 0)) {
      setError("Для поля типа «Список» укажите хотя бы один вариант");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await updateSurveyField(cohortId, field.id, {
          label: label.trim(),
          type,
          options: optionsString,
        });
      } else {
        // Получаем текущий order для нового поля
        const currentFields = queryClient.getQueryData<SurveyField[]>(["survey-fields", cohortId]);
        const order = (currentFields?.length ?? 0) + 1;
        await createSurveyField(cohortId, {
          label: label.trim(),
          type,
          options: optionsString,
          order,
        });
      }
      queryClient.invalidateQueries({
        queryKey: ["survey-fields", cohortId],
      });
      onOpenChange(false);
    } catch {
      setError("Ошибка при сохранении поля");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Редактировать поле" : "Добавить поле"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Измените параметры поля анкеты"
              : "Новое поле будет добавлено в конец списка"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="field-label">
              Название поля <span className="text-destructive">*</span>
            </Label>
            <Input
              id="field-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Например: ФИО"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="field-type">Тип поля</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as SurveyFieldType)}
            >
              <SelectTrigger id="field-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Текст</SelectItem>
                <SelectItem value="select">Список</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === "select" && (
            <div className="space-y-2">
              <Label htmlFor="field-options">
                Варианты выбора{" "}
                <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                Каждый вариант с новой строки
              </p>
              <Textarea
                id="field-options"
                value={optionsText}
                onChange={(e) => setOptionsText(e.target.value)}
                placeholder="Frontend&#10;Backend&#10;Аналитик"
                rows={4}
              />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Сохранение..."
                : isEditing
                  ? "Сохранить"
                  : "Добавить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}