"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  fetchMyApplications,
  fetchPrefillData,
  fetchApplicationTestTask,
  type ApplicationWithFieldValues,
} from "@/lib/api/applications";
import {
  fetchMyTestTaskSubmission,
  submitTestTaskSolution,
  type TestTaskSubmission,
} from "@/lib/api/test-task-submission";
import { fetchPublicAcceptingCohorts } from "@/lib/api/survey";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  FileText,
  Plus,
  Calendar,
  MessageSquare,
  Eye,
  Building2,
  ChevronRight,
  ClipboardList,
  Send,
  CheckCircle2,
} from "lucide-react";
import type { ApplicationStatus } from "@/entities";
import type { Cohort } from "@/entities/cohort";
import { toast } from "sonner";

const statusLabels: Record<ApplicationStatus, string> = {
  pending: "На рассмотрении",
  approved: "Одобрена",
  rejected: "Отклонена",
};

const statusVariants: Record<ApplicationStatus, "secondary" | "default" | "destructive"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
};

// ---- Cohort Selection Dialog ----
function CohortSelectDialog({
  acceptingCohorts,
  open,
  onOpenChange,
  onSelect,
}: {
  acceptingCohorts: Cohort[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (cohort: Cohort) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Выберите когорту</DialogTitle>
          <DialogDescription>
            Когорты, которые сейчас принимают заявки
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          {acceptingCohorts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Сейчас нет когорт с открытым приёмом заявок.
            </p>
          ) : (
            acceptingCohorts.map((cohort) => (
              <button
                key={cohort.id}
                onClick={() => onSelect(cohort)}
                className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent"
              >
                <Building2 className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Когорта {cohort.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Приём до {formatDate(cohort.applicationEnd)}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ---- Test Task Dialog ----
function TestTaskDialog({
  application,
  open,
  onOpenChange,
}: {
  application: ApplicationWithFieldValues | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [submissionContent, setSubmissionContent] = useState("");
  const [showForm, setShowForm] = useState(false);

  const testTaskQuery = useQuery({
    queryKey: ["test-task", application?.id],
    queryFn: () => fetchApplicationTestTask(application!.id),
    enabled: open && !!application?.id,
  });

  const submissionQuery = useQuery({
    queryKey: ["test-task-submission", application?.id],
    queryFn: () => fetchMyTestTaskSubmission(application!.id),
    enabled: open && !!application?.id && testTaskQuery.data?.published === true,
  });

  const submitMutation = useMutation({
    mutationFn: (content: string) =>
      submitTestTaskSolution(application!.id, content),
    onSuccess: () => {
      toast.success("Решение отправлено");
      setShowForm(false);
      submissionQuery.refetch();
    },
    onError: () => {
      toast.error("Ошибка при отправке решения");
    },
  });

  const handleSubmit = () => {
    if (!submissionContent.trim()) return;
    submitMutation.mutate(submissionContent);
  };

  if (!application) return null;

  const { data: testTask } = testTaskQuery;
  const { data: submissionData } = submissionQuery;
  const existingSubmission = submissionData?.submission;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Тестовое задание</DialogTitle>
          <DialogDescription>
            {application.cohortName ?? "Когорта"}
          </DialogDescription>
        </DialogHeader>

        {testTaskQuery.isLoading ? (
          <p className="py-4 text-sm text-muted-foreground">Загрузка...</p>
        ) : testTask?.published ? (
          <div className="space-y-4 py-2">
            <div className="rounded-lg border bg-muted/30 p-4 whitespace-pre-wrap text-sm">
              {testTask.content}
            </div>

            {existingSubmission ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Решение отправлено</span>
                </div>
                <Label>Ваше решение</Label>
                <div className="rounded-lg border bg-muted/30 p-4 whitespace-pre-wrap text-sm">
                  {existingSubmission.content}
                </div>
              </div>
            ) : showForm ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="submission-content">Ваше решение</Label>
                  <Textarea
                    id="submission-content"
                    value={submissionContent}
                    onChange={(e) => setSubmissionContent(e.target.value)}
                    placeholder="Напишите решение тестового задания..."
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSubmit}
                    disabled={submitMutation.isPending || !submissionContent.trim()}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {submitMutation.isPending ? "Отправка..." : "Отправить"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={() => setShowForm(true)}>
                <ClipboardList className="mr-2 h-4 w-4" />
                Отправить решение
              </Button>
            )}
          </div>
        ) : (
          <p className="py-4 text-sm text-muted-foreground">
            Тестовое задание ещё не опубликовано
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---- Application Detail Dialog ----
function ApplicationDetailDialog({
  application,
  open,
  onOpenChange,
}: {
  application: ApplicationWithFieldValues | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!application) return null;

  const sortedFields = application.fieldValues
    ? [...application.fieldValues].sort((a, b) => a.field.order - b.field.order)
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Данные заявки</DialogTitle>
          <DialogDescription>
            {application.cohortName ?? "Когорта"}
          </DialogDescription>
        </DialogHeader>

        {sortedFields.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            Данные анкеты отсутствуют
          </p>
        ) : (
          <div className="space-y-4 py-2">
            {sortedFields.map((fv) => (
              <div key={fv.id}>
                <Label className="text-sm text-muted-foreground">
                  {fv.field.label}
                </Label>
                <p className="mt-1 text-sm font-medium">
                  {fv.value || "—"}
                </p>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CabinetApplicationsPage() {
  const [viewingApp, setViewingApp] = useState<ApplicationWithFieldValues | null>(null);
  const [viewingTestTask, setViewingTestTask] = useState<ApplicationWithFieldValues | null>(null);

  const applicationsQuery = useQuery({
    queryKey: ["applications"],
    queryFn: () => fetchMyApplications(),
  });

  const prefillQuery = useQuery({
    queryKey: ["applications", "prefill"],
    queryFn: () => fetchPrefillData(),
    staleTime: 5 * 60 * 1000,
  });

  const applications: ApplicationWithFieldValues[] = applicationsQuery.data ?? [];
  const hasPrefill =
    prefillQuery.data?.data &&
    Object.keys(prefillQuery.data.data).length > 0;

  const router = useRouter();

  // Получаем список когорт, принимающих заявки
  const acceptingCohortsQuery = useQuery({
    queryKey: ["public", "accepting-cohorts"],
    queryFn: () => fetchPublicAcceptingCohorts().catch(() => [] as Cohort[]),
    staleTime: 5 * 60 * 1000,
  });

  const acceptingCohorts: Cohort[] = acceptingCohortsQuery.data ?? [];

  // Состояние диалога выбора когорты
  const [cohortSelectOpen, setCohortSelectOpen] = useState(false);

  const handleSelectCohort = (cohort: Cohort) => {
    setCohortSelectOpen(false);
    router.push(`/survey/${cohort.name}`);
  };

  const handleCohortClick = () => {
    // Всегда открываем диалог выбора когорты, даже если когорта одна
    setCohortSelectOpen(true);
  };

  const surveyButton = (
    <Button onClick={handleCohortClick}>
      <Plus className="mr-2 h-4 w-4" />
      Подать заявку
    </Button>
  );

  if (applicationsQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (applicationsQuery.error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Ошибка загрузки</AlertTitle>
        <AlertDescription>
          Не удалось загрузить список заявок. Попробуйте обновить страницу.
        </AlertDescription>
      </Alert>
    );
  }

  if (applications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Заявки на практику
          </CardTitle>
          <CardDescription>
            У вас пока нет поданных заявок
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 py-8">
          <p className="text-center text-sm text-muted-foreground">
            Подайте заявку на практику, чтобы начать.
            <br />
            Заявки принимаются в период приёма активной когорты.
          </p>
          {surveyButton}

          {/* Диалог выбора когорты */}
          <CohortSelectDialog
            acceptingCohorts={acceptingCohorts}
            open={cohortSelectOpen}
            onOpenChange={setCohortSelectOpen}
            onSelect={handleSelectCohort}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Заявки на практику
          </h1>
          <p className="text-sm text-muted-foreground">
            Всего заявок: {applications.length}
          </p>
        </div>
        {surveyButton}
      </div>

      {hasPrefill && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>У вас есть данные из предыдущей заявки</AlertTitle>
          <AlertDescription>
            При подаче новой заявки поля будут предзаполнены вашими данными.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        {applications.map((app) => (
          <Card key={app.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-base">
                    {app.cohortName ?? "Когорта"}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(app.createdAt)}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setViewingApp(app)}
                    title="Просмотреть данные заявки"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setViewingTestTask(app)}
                    title="Тестовое задание"
                  >
                    <ClipboardList className="h-3.5 w-3.5" />
                  </Button>
                  <Badge variant={statusVariants[app.status]}>
                    {statusLabels[app.status]}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            {app.reviewComment && (
              <CardContent>
                <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-sm">
                  <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Комментарий администратора:
                    </p>
                    <p className="mt-0.5">{app.reviewComment}</p>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Диалог выбора когорты */}
      <CohortSelectDialog
        acceptingCohorts={acceptingCohorts}
        open={cohortSelectOpen}
        onOpenChange={setCohortSelectOpen}
        onSelect={handleSelectCohort}
      />

      {/* Диалог просмотра данных заявки */}
      <ApplicationDetailDialog
        application={viewingApp}
        open={viewingApp !== null}
        onOpenChange={(open) => {
          if (!open) setViewingApp(null);
        }}
      />

      {/* Диалог тестового задания */}
      <TestTaskDialog
        application={viewingTestTask}
        open={viewingTestTask !== null}
        onOpenChange={(open) => {
          if (!open) {
            setViewingTestTask(null);
          }
        }}
      />
    </div>
  );
}