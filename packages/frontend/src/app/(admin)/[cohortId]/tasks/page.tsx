"use client";

import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { startOfWeek, subWeeks, addWeeks, parseISO, format } from "date-fns";
import { toast } from "sonner";

import { fetchTasks, createTask, updateTask, deleteTask } from "@/lib/api/tasks";
import { fetchCohort } from "@/lib/api/cohorts";
import { fetchCohortParticipants } from "@/lib/api/participants";
import { MultiParticipantGrid } from "@/features/tasks/multi-participant-grid";
import { TaskCardDialog } from "@/features/tasks/task-card-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Users, Edit } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { TaskCard } from "@/entities";

export default function AdminTasksPage() {
  const queryClient = useQueryClient();
  const params = useParams<{ cohortId: string }>();
  const cohortId = params.cohortId;

  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [editMode, setEditMode] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTask, setDialogTask] = useState<TaskCard | null>(null);
  const [dialogDate, setDialogDate] = useState<string | null>(null);
  const [dialogReadOnly, setDialogReadOnly] = useState(true);
  const [dialogParticipantUserId, setDialogParticipantUserId] = useState<string | null>(null);
  const [dialogParticipantName, setDialogParticipantName] = useState<string | undefined>(undefined);
  const [dialogParticipantRole, setDialogParticipantRole] = useState<string | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<TaskCard | null>(null);

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

  // Мутации
  const createMutation = useMutation({
    mutationFn: (data: { date: string; title: string; description?: string; artifactLink?: string; userId: string }) =>
      createTask({ cohortId, ...data }),
    onSuccess: () => {
      toast.success("Задача создана");
      queryClient.invalidateQueries({ queryKey: ["admin-tasks"] });
      setDialogOpen(false);
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Ошибка при создании задачи";
      toast.error(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; title: string; description?: string; artifactLink?: string }) =>
      updateTask(data.id, { title: data.title, description: data.description, artifactLink: data.artifactLink }),
    onSuccess: () => {
      toast.success("Задача обновлена");
      queryClient.invalidateQueries({ queryKey: ["admin-tasks"] });
      setDialogOpen(false);
    },
    onError: () => toast.error("Ошибка при обновлении задачи"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => {
      toast.success("Задача удалена");
      queryClient.invalidateQueries({ queryKey: ["admin-tasks"] });
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
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

  // Клик по ячейке — просмотр (readOnly) в обычном режиме
  // В режиме редактирования "+" вызывает создание задачи
  const handleCellClick = useCallback(
    (date: string, task: TaskCard | null, participantUserId: string) => {
      setDialogTask(task);
      setDialogDate(date);
      setDialogParticipantUserId(participantUserId);
      const participant = participants.find((p) => p.userId === participantUserId);
      setDialogParticipantName(participant?.userName);
      setDialogParticipantRole(participant?.roleName);

      if (editMode) {
        // В режиме редактирования клик на "+" (task===null) → создание
        // Клик на задачу → readOnly (просмотр)
        setDialogReadOnly(task !== null);
      } else {
        // В режиме просмотра всегда readOnly
        setDialogReadOnly(true);
      }
      setDialogOpen(true);
    },
    [participants, editMode],
  );

  // Клик на иконку редактирования — открываем редактирование
  const handleEditTask = useCallback(
    (task: TaskCard) => {
      setDialogTask(task);
      setDialogDate(task.date);
      setDialogParticipantUserId(task.userId);
      const participant = participants.find((p) => p.userId === task.userId);
      setDialogParticipantName(participant?.userName);
      setDialogParticipantRole(participant?.roleName);
      setDialogReadOnly(false);
      setDialogOpen(true);
    },
    [participants],
  );

  // Клик на иконку удаления
  const handleDeleteTask = useCallback((task: TaskCard) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (taskToDelete) {
      deleteMutation.mutate(taskToDelete.id);
    }
  }, [taskToDelete, deleteMutation]);

  const handleSave = useCallback(
    (data: { title: string; description: string; artifactLink: string | null }) => {
      const payload: { title: string; description?: string; artifactLink?: string } = {
        title: data.title,
      };
      if (data.description) payload.description = data.description;
      if (data.artifactLink) payload.artifactLink = data.artifactLink;

      if (dialogTask) {
        updateMutation.mutate({ id: dialogTask.id, ...payload });
      } else if (dialogDate && dialogParticipantUserId) {
        // При создании задачи от админа нужно передать userId
        createMutation.mutate({ date: dialogDate, ...payload, userId: dialogParticipantUserId });
      }
    },
    [dialogTask, dialogDate, dialogParticipantUserId, createMutation, updateMutation],
  );

  const isDialogReadOnly = dialogReadOnly;

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Задачи</h1>
          <p className="text-sm text-muted-foreground">
            {data?.cohortName ?? "Недельная сетка задач"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="edit-mode"
            checked={editMode}
            onCheckedChange={(checked) => setEditMode(checked === true)}
          />
          <Label htmlFor="edit-mode" className="text-sm flex items-center gap-1 cursor-pointer">
            <Edit className="h-3.5 w-3.5" />
            Режим редактирования
          </Label>
        </div>
      </div>

      {editMode ? (
        <Alert>
          <Edit className="h-4 w-4" />
          <AlertDescription>
            Режим редактирования активен. Вы можете добавлять, редактировать и удалять задачи
            всех участников когорты.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <Users className="h-4 w-4" />
          <AlertDescription>
            Отображаются задачи всех участников когорты. Слева — ФИО практиканта.
            Включите Режим редактирования для изменения задач.
          </AlertDescription>
        </Alert>
      )}

      <MultiParticipantGrid
        currentWeekStart={currentWeekStart}
        practiceStart={practiceStart}
        practiceEnd={practiceEnd}
        tasks={tasks}
        participants={participants}
        currentUserId=""  // пустой → админский режим
        showAll={true}
        canEdit={editMode}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
        onCellClick={handleCellClick}
        onEditTask={editMode ? handleEditTask : undefined}
        onDeleteTask={editMode ? handleDeleteTask : undefined}
      />

      <TaskCardDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={dialogTask}
        date={dialogDate}
        readOnly={isDialogReadOnly}
        participantName={dialogParticipantName}
        participantRole={dialogParticipantRole}
        onSave={handleSave}
      />

      {/* Диалог подтверждения удаления */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить задачу?</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить задачу `{taskToDelete?.title}`?
              Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}