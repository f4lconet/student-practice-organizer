"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  startOfWeek,
  subWeeks,
  addWeeks,
  format,
} from "date-fns";

import { useAuth } from "@/providers/auth-provider";
import { fetchTasks, createTask, updateTask, deleteTask } from "@/lib/api/tasks";
import { fetchDashboard } from "@/lib/api/dashboard";
import { fetchCohort, fetchActiveCohort } from "@/lib/api/cohorts";
import { fetchCohortParticipants } from "@/lib/api/participants";
import { MultiParticipantGrid } from "@/features/tasks/multi-participant-grid";
import { TaskCardDialog } from "@/features/tasks/task-card-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Users } from "lucide-react";
import type { TaskCard } from "@/entities";

export default function CabinetTasksPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [showAll, setShowAll] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTask, setDialogTask] = useState<TaskCard | null>(null);
  const [dialogDate, setDialogDate] = useState<string | null>(null);
  const [dialogParticipantUserId, setDialogParticipantUserId] = useState<string | null>(null);
  const [dialogParticipantName, setDialogParticipantName] = useState<string | undefined>(undefined);

  const weekStartStr = format(currentWeekStart, "yyyy-MM-dd");

  // Получаем cohortId из dashboard
  const { data: dashboard } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => fetchDashboard(),
  });

  const cohortId = dashboard?.applications?.[0]?.cohortId ?? "";

  // Загружаем данные когорты
  const { data: cohort } = useQuery({
    queryKey: ["cohort", cohortId],
    queryFn: async () => {
      const adminCohort = await fetchCohort(cohortId).catch(() => null);
      if (adminCohort) return adminCohort;

      const activeCohort = await fetchActiveCohort().catch(() => null);
      if (activeCohort && activeCohort.id === cohortId) return activeCohort;

      return null;
    },
    enabled: !!cohortId,
    retry: false,
  });

  const practiceStart = cohort ? new Date(cohort.practiceStart) : subWeeks(currentWeekStart, 52);
  const practiceEnd = cohort ? new Date(cohort.practiceEnd) : addWeeks(currentWeekStart, 52);

  // Загрузка задач
  const tasksQuery = useQuery({
    queryKey: ["tasks", cohortId, weekStartStr, showAll],
    queryFn: () => fetchTasks({ cohortId, weekStart: weekStartStr, all: showAll }),
    enabled: !!cohortId,
  });

  // Загрузка участников (нужны для отображения ФИО)
  const { data: participants = [] } = useQuery({
    queryKey: ["cohort-participants", cohortId],
    queryFn: () => fetchCohortParticipants(cohortId),
    enabled: !!cohortId && showAll,
  });

  // Создаём участника для текущего пользователя, если его нет в списке
  const allParticipants = useMemo(() => {
    if (participants.length === 0 && userId) {
      // Если участники не загружены (showAll=false), создаём виртуального
      return [{ userId, userName: "Вы" }];
    }
    // Убеждаемся, что текущий пользователь есть в списке
    const hasCurrent = participants.some((p) => p.userId === userId);
    if (!hasCurrent && userId) {
      return [...participants, { userId, userName: "Вы" }];
    }
    return participants;
  }, [participants, userId]);

  const workdays = tasksQuery.data?.workdays ?? [];
  const tasks = workdays.flatMap((wd) => wd.tasks);
  const isLoading = tasksQuery.isLoading;
  const error = tasksQuery.error;

  // Мутации
  const createMutation = useMutation({
    mutationFn: (data: { date: string; title: string; description?: string; artifactLink?: string }) =>
      createTask({ cohortId, ...data }),
    onSuccess: () => {
      toast.success("Задача создана");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setDialogOpen(false);
    },
    onError: () => toast.error("Ошибка при создании задачи"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; title: string; description?: string; artifactLink?: string }) =>
      updateTask(data.id, { title: data.title, description: data.description, artifactLink: data.artifactLink }),
    onSuccess: () => {
      toast.success("Задача обновлена");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setDialogOpen(false);
    },
    onError: () => toast.error("Ошибка при обновлении задачи"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => {
      toast.success("Задача удалена");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setDialogOpen(false);
    },
    onError: () => toast.error("Ошибка при удалении задачи"),
  });

  const handlePrevWeek = useCallback(() => {
    setCurrentWeekStart((prev) => subWeeks(prev, 1));
  }, []);

  const handleNextWeek = useCallback(() => {
    setCurrentWeekStart((prev) => addWeeks(prev, 1));
  }, []);

  const handleCellClick = useCallback(
    (date: string, task: TaskCard | null, participantUserId: string) => {
      setDialogTask(task);
      setDialogDate(date);
      setDialogParticipantUserId(participantUserId);
      // Ищем ФИО
      const participant = allParticipants.find((p) => p.userId === participantUserId);
      setDialogParticipantName(participant?.userName);
      setDialogOpen(true);
    },
    [allParticipants],
  );

  const handleSave = useCallback(
    (data: { title: string; description: string; artifactLink: string | null }) => {
      // Отправляем только непустые поля, чтобы не ломать бэкенд
      const payload: { title: string; description?: string; artifactLink?: string } = {
        title: data.title,
      };
      if (data.description) payload.description = data.description;
      if (data.artifactLink) payload.artifactLink = data.artifactLink;

      if (dialogTask) {
        updateMutation.mutate({ id: dialogTask.id, ...payload });
      } else if (dialogDate) {
        createMutation.mutate({ date: dialogDate, ...payload });
      }
    },
    [dialogTask, dialogDate, createMutation, updateMutation],
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteMutation.mutate(id);
    },
    [deleteMutation],
  );

  const isDialogReadOnly =
    dialogParticipantUserId !== null && dialogParticipantUserId !== userId;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Ошибка загрузки</AlertTitle>
        <AlertDescription>
          Не удалось загрузить задачи. Попробуйте обновить страницу.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Задачи</h1>
          <p className="text-sm text-muted-foreground">
            {tasksQuery.data?.cohortName ?? "Недельная сетка задач"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="show-all"
            checked={showAll}
            onCheckedChange={(checked) => setShowAll(checked === true)}
          />
          <Label htmlFor="show-all" className="cursor-pointer text-sm">
            Показать всех
          </Label>
        </div>
      </div>

      {showAll && (
        <Alert>
          <Users className="h-4 w-4" />
          <AlertTitle>Режим просмотра всех участников</AlertTitle>
          <AlertDescription>
            Отображаются задачи всех участников когорты. Слева — ФИО практиканта.
            Чужие карточки — только для просмотра.
          </AlertDescription>
        </Alert>
      )}

      <MultiParticipantGrid
        currentWeekStart={currentWeekStart}
        practiceStart={practiceStart}
        practiceEnd={practiceEnd}
        tasks={tasks}
        participants={allParticipants}
        currentUserId={userId}
        showAll={showAll}
        canEdit={true}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
        onCellClick={handleCellClick}
      />

      <TaskCardDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={dialogTask}
        date={dialogDate}
        readOnly={isDialogReadOnly}
        participantName={dialogParticipantName}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}