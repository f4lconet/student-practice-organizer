"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  fetchCohorts,
  createCohort,
  updateCohort,
  archiveCohort,
  unarchiveCohort,
} from "@/lib/api/cohorts";
import { useAdminCohortStore } from "@/lib/stores/admin-cohort-store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Badge,
} from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Plus, AlertCircle, Archive, ArchiveRestore, ArchiveX } from "lucide-react";
import { z } from "zod";
import type { Cohort } from "@/entities/cohort";

// Zod схема валидации формы когорты
const cohortFormSchema = z
  .object({
    name: z.string().min(1, "Название обязательно"),
    application_start: z.string().min(1, "Дата начала приёма заявок обязательна"),
    application_end: z.string().min(1, "Дата окончания приёма заявок обязательна"),
    practice_start: z.string().min(1, "Дата начала практики обязательна"),
    practice_end: z.string().min(1, "Дата окончания практики обязательна"),
  })
  .refine(
    (data) => new Date(data.application_end) >= new Date(data.application_start),
    {
      message: "Дата окончания приёма заявок не может быть раньше даты начала",
      path: ["application_end"],
    },
  )
  .refine(
    (data) => new Date(data.practice_end) >= new Date(data.practice_start),
    {
      message: "Дата окончания практики не может быть раньше даты начала",
      path: ["practice_end"],
    },
  );

type CohortFormData = z.infer<typeof cohortFormSchema>;

function initFormData(cohort?: Cohort): CohortFormData {
  return {
    name: cohort?.name ?? "",
    application_start: cohort?.applicationStart
      ? cohort.applicationStart.slice(0, 10)
      : "",
    application_end: cohort?.applicationEnd
      ? cohort.applicationEnd.slice(0, 10)
      : "",
    practice_start: cohort?.practiceStart
      ? cohort.practiceStart.slice(0, 10)
      : "",
    practice_end: cohort?.practiceEnd ? cohort.practiceEnd.slice(0, 10) : "",
  };
}

function CohortFormDialog({
  open,
  onOpenChange,
  cohort,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cohort?: Cohort;
}) {
  const isEditing = !!cohort;

  return (
    <Dialog key={cohort?.id ?? "new"} open={open} onOpenChange={onOpenChange}>
      <CohortFormContent
        cohort={cohort}
        onOpenChange={onOpenChange}
        isEditing={isEditing}
      />
    </Dialog>
  );
}

function CohortFormContent({
  cohort,
  onOpenChange,
  isEditing,
}: {
  cohort?: Cohort;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
}) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CohortFormData>(
    initFormData(cohort),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = cohortFormSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        if (!fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        applicationStart: new Date(formData.application_start).toISOString(),
        applicationEnd: new Date(formData.application_end).toISOString(),
        practiceStart: new Date(formData.practice_start).toISOString(),
        practiceEnd: new Date(formData.practice_end).toISOString(),
      };

      if (isEditing && cohort) {
        await updateCohort(cohort.id, payload);
      } else {
        await createCohort({ ...payload, isArchived: false });
      }

      queryClient.invalidateQueries({ queryKey: ["cohorts"] });
      onOpenChange(false);
    } catch {
      setErrors({ form: "Ошибка при сохранении когорты" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof CohortFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>
          {isEditing ? "Редактировать когорту" : "Создать когорту"}
        </DialogTitle>
        <DialogDescription>
          Заполните основные параметры когорты. Даты окончания не могут быть
          раньше дат начала.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">
            Название / год <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="2026"
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="application_start">
              Начало приёма заявок <span className="text-destructive">*</span>
            </Label>
            <Input
              id="application_start"
              type="date"
              value={formData.application_start}
              onChange={(e) =>
                updateField("application_start", e.target.value)
              }
            />
            {errors.application_start && (
              <p className="text-sm text-destructive">
                {errors.application_start}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="application_end">
              Окончание приёма заявок{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="application_end"
              type="date"
              value={formData.application_end}
              onChange={(e) =>
                updateField("application_end", e.target.value)
              }
            />
            {errors.application_end && (
              <p className="text-sm text-destructive">
                {errors.application_end}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="practice_start">
              Начало практики <span className="text-destructive">*</span>
            </Label>
            <Input
              id="practice_start"
              type="date"
              value={formData.practice_start}
              onChange={(e) =>
                updateField("practice_start", e.target.value)
              }
            />
            {errors.practice_start && (
              <p className="text-sm text-destructive">
                {errors.practice_start}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="practice_end">
              Окончание практики <span className="text-destructive">*</span>
            </Label>
            <Input
              id="practice_end"
              type="date"
              value={formData.practice_end}
              onChange={(e) => updateField("practice_end", e.target.value)}
            />
            {errors.practice_end && (
              <p className="text-sm text-destructive">
                {errors.practice_end}
              </p>
            )}
          </div>
        </div>

        {errors.form && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.form}</AlertDescription>
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
                : "Создать"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function formatDate(dateStr: string): string {
  try {
    return format(new Date(dateStr), "d MMM yyyy", { locale: ru });
  } catch {
    return dateStr;
  }
}

function CohortCard({
  cohort,
  onSelect,
  onEdit,
  onArchive,
  onUnarchive,
}: {
  cohort: Cohort;
  onSelect: (cohort: Cohort) => void;
  onEdit: (e: React.MouseEvent, cohort: Cohort) => void;
  onArchive: (e: React.MouseEvent, cohort: Cohort) => void;
  onUnarchive: (e: React.MouseEvent, cohort: Cohort) => void;
}) {
  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-accent/50"
      onClick={() => onSelect(cohort)}
    >
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-xl">{cohort.name}</CardTitle>
          {cohort.isArchived && (
            <Badge variant="secondary" className="shrink-0">
              <Archive className="mr-1 h-3 w-3" />
              В архиве
            </Badge>
          )}
        </div>
        <CardDescription>
          Приём заявок: {formatDate(cohort.applicationStart)} —{" "}
          {formatDate(cohort.applicationEnd)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarIcon className="h-4 w-4" />
          <span>
            Практика: {formatDate(cohort.practiceStart)} —{" "}
            {formatDate(cohort.practiceEnd)}
          </span>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => onEdit(e, cohort)}
        >
          Редактировать
        </Button>

        {cohort.isArchived ? (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-muted-foreground hover:text-foreground"
            onClick={(e) => onUnarchive(e, cohort)}
          >
            <ArchiveRestore className="mr-1 h-4 w-4" />
            Восстановить
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-muted-foreground hover:text-destructive"
            onClick={(e) => onArchive(e, cohort)}
          >
            <ArchiveX className="mr-1 h-4 w-4" />
            В архив
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default function CohortsPage() {
  const router = useRouter();
  const setSelectedCohortId = useAdminCohortStore(
    (s) => s.setSelectedCohortId,
  );
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCohort, setEditingCohort] = useState<Cohort | undefined>(
    undefined,
  );
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmUnarchive, setConfirmUnarchive] = useState(false);

  const {
    data: cohorts,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["cohorts"],
    queryFn: fetchCohorts,
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => archiveCohort(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cohorts"] });
    },
  });

  const unarchiveMutation = useMutation({
    mutationFn: (id: string) => unarchiveCohort(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cohorts"] });
    },
  });

  const activeCohorts = cohorts?.filter((c) => !c.isArchived) ?? [];
  const archivedCohorts = cohorts?.filter((c) => c.isArchived) ?? [];

  const handleSelectCohort = (cohort: Cohort) => {
    if (cohort.isArchived) return;
    setSelectedCohortId(cohort.id);
    router.push(`/${cohort.id}/applications`);
  };

  const handleCreateCohort = () => {
    setEditingCohort(undefined);
    setDialogOpen(true);
  };

  const handleEditCohort = (e: React.MouseEvent, cohort: Cohort) => {
    e.stopPropagation();
    setEditingCohort(cohort);
    setDialogOpen(true);
  };

  const handleArchiveClick = (e: React.MouseEvent, cohort: Cohort) => {
    e.stopPropagation();
    setConfirmId(cohort.id);
    setConfirmUnarchive(false);
  };

  const handleUnarchiveClick = (e: React.MouseEvent, cohort: Cohort) => {
    e.stopPropagation();
    setConfirmId(cohort.id);
    setConfirmUnarchive(true);
  };

  const handleConfirm = () => {
    if (!confirmId) return;
    if (confirmUnarchive) {
      unarchiveMutation.mutate(confirmId);
    } else {
      archiveMutation.mutate(confirmId);
    }
    setConfirmId(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Ошибка загрузки когорт. Пожалуйста, попробуйте позже.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Когорты</h1>
          <p className="text-muted-foreground">
            Выберите когорту для управления или создайте новую
          </p>
        </div>
        <Button onClick={handleCreateCohort}>
          <Plus className="mr-2 h-4 w-4" />
          Создать когорту
        </Button>
      </div>

      {!cohorts || cohorts.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Нет когорт</CardTitle>
            <CardDescription>
              Создайте первую когорту, чтобы начать работу
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={handleCreateCohort}>
              <Plus className="mr-2 h-4 w-4" />
              Создать когорту
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <>
          <Tabs defaultValue="active">
            <TabsList>
              <TabsTrigger value="active">
                Активные
                {activeCohorts.length > 0 && (
                  <Badge variant="default" className="ml-1.5 h-5 px-1.5 text-xs">
                    {activeCohorts.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="archived">
                Архив
                {archivedCohorts.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
                    {archivedCohorts.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-6">
              {activeCohorts.length === 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Нет активных когорт</CardTitle>
                    <CardDescription>
                      Все когорты находятся в архиве
                    </CardDescription>
                  </CardHeader>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {activeCohorts.map((cohort) => (
                    <CohortCard
                      key={cohort.id}
                      cohort={cohort}
                      onSelect={handleSelectCohort}
                      onEdit={handleEditCohort}
                      onArchive={handleArchiveClick}
                      onUnarchive={handleUnarchiveClick}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="archived" className="mt-6">
              {archivedCohorts.length === 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Архив пуст</CardTitle>
                    <CardDescription>
                      Нет архивированных когорт
                    </CardDescription>
                  </CardHeader>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {archivedCohorts.map((cohort) => (
                    <CohortCard
                      key={cohort.id}
                      cohort={cohort}
                      onSelect={handleSelectCohort}
                      onEdit={handleEditCohort}
                      onArchive={handleArchiveClick}
                      onUnarchive={handleUnarchiveClick}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Диалог подтверждения архивации/разархивации */}
          <Dialog open={!!confirmId} onOpenChange={(open) => !open && setConfirmId(null)}>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>
                  {confirmUnarchive ? "Восстановить когорту?" : "Архивировать когорту?"}
                </DialogTitle>
                <DialogDescription>
                  {confirmUnarchive
                    ? "Когорта снова станет доступна для работы с заявками, документами и задачами."
                    : "Архивированная когорта будет перемещена во вкладку «Архив». С ней нельзя будет работать, пока вы её не восстановите."
                  }
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setConfirmId(null)}
                >
                  Отмена
                </Button>
                <Button
                  variant={confirmUnarchive ? "default" : "secondary"}
                  onClick={handleConfirm}
                  disabled={archiveMutation.isPending || unarchiveMutation.isPending}
                >
                  {confirmUnarchive ? "Восстановить" : "Архивировать"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      <CohortFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        cohort={editingCohort}
      />
    </div>
  );
}