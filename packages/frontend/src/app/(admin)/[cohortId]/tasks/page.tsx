"use client";

import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { startOfWeek, subWeeks, addWeeks, parseISO, format } from "date-fns";

import { fetchTasks } from "@/lib/api/tasks";
import { fetchCohort } from "@/lib/api/cohorts";
import { fetchCohortParticipants } from "@/lib/api/participants";
import { MultiParticipantGrid } from "@/features/tasks/multi-participant-grid";
import { TaskCardDialog } from "@/features/tasks/task-card-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Users } from "lucide-react";
import type { TaskCard } from "@/entities";

export default function AdminTasksPage() {
  const params = useParams<{ cohortId: string }>();
  const cohortId = params.cohortId;

  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTask, setDialogTask] = useState<TaskCard | null>(null);
  const [dialogDate, setDialogDate] = useState<string | null>(null);
  const [dialogParticipantName, setDialogParticipantName] = useState<string | undefined>(undefined);

  const weekStartStr = format(currentWeekStart, "yyyy-MM-dd");

  // Загружаем данные когорты
  const { data: cohort } = useQuery({
    queryKey: ["cohort", cohortId],
    queryFn: () => fetchCohort(cohortId),
    enabled: !!cohortId,
  });

  const practiceStart = cohort ? parseISO(cohort.practiceStart) : new Date();
  const practiceEnd = cohort ? parseISO(cohort.practiceEnd) : new Date();

  // Загружаем задачи всех участников
  const { data, isLoading: tasksLoading, error: tasksError } = useQuery({
    queryKey: ["admin-tasks", cohortId, weekStartStr],
    queryFn: () => fetchTasks({ cohortId, weekStart: weekStartStr, all: true }),
    enabled: !!cohortId,
  });

  // Загружаем список участников когорты
  const { data: participants = [], isLoading: participantsLoading } = useQuery({
    queryKey: ["cohort-participants", cohortId],
    queryFn: () => fetchCohortParticipants(cohortId),
    enabled: !!cohortId,
  });

  const workdays = data?.workdays ?? [];
  const tasks = workdays.flatMap((wd: { date: string; tasks: TaskCard[] }) => wd.tasks);
  const isLoading = tasksLoading || participantsLoading;

  const handlePrevWeek = useCallback(() => {
    setCurrentWeekStart((prev) => subWeeks(prev, 1));
  }, []);

  const handleNextWeek = useCallback(() => {
    setCurrentWeekStart((prev) => addWeeks(prev, 1));
  }, []);

  // Клик по ячейке — просмотр (readOnly для админа)
  const handleCellClick = useCallback(
    (date: string, task: TaskCard | null, participantUserId: string) => {
      if (!task) return; // Админ не может создавать задачи
      setDialogTask(task);
      setDialogDate(date);
      // Ищем ФИО участника
      const participant = participants.find((p) => p.userId === participantUserId);
      setDialogParticipantName(participant?.userName);
      setDialogOpen(true);
    },
    [participants],
  );

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

  if (tasksError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Не удалось загрузить задачи. Попробуйте обновить страницу.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Задачи</h1>
        <p className="text-sm text-muted-foreground">
          {data?.cohortName ?? "Недельная сетка задач"} — просмотр всех участников
        </p>
      </div>

      <Alert>
        <Users className="h-4 w-4" />
        <AlertDescription>
          Отображаются задачи всех участников когорты. Слева — ФИО практиканта.
          Карточки — только для просмотра.
        </AlertDescription>
      </Alert>

      <MultiParticipantGrid
        currentWeekStart={currentWeekStart}
        practiceStart={practiceStart}
        practiceEnd={practiceEnd}
        tasks={tasks}
        participants={participants}
        currentUserId=""
        showAll={true}
        canEdit={false}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
        onCellClick={handleCellClick}
      />

      <TaskCardDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={dialogTask}
        date={dialogDate}
        readOnly={true}
        participantName={dialogParticipantName}
        onSave={() => {}}
      />
    </div>
  );
}