"use client";

import { useMemo } from "react";
import {
  addWeeks,
  subWeeks,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isBefore,
  isAfter,
  format,
} from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, ExternalLink, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { TaskCard, CohortParticipant } from "@/entities";

interface MultiParticipantGridProps {
  currentWeekStart: Date;
  practiceStart: Date;
  practiceEnd: Date;
  tasks: TaskCard[];
  participants: CohortParticipant[];
  currentUserId: string;
  showAll: boolean;
  canEdit: boolean;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onCellClick: (date: string, task: TaskCard | null, participantUserId: string) => void;
  onEditTask?: (task: TaskCard) => void;
  onDeleteTask?: (task: TaskCard) => void;
}

function isSaturdayOrSunday(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function formatDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function MultiParticipantGrid({
  currentWeekStart,
  practiceStart,
  practiceEnd,
  tasks,
  participants,
  currentUserId,
  showAll,
  canEdit,
  onPrevWeek,
  onNextWeek,
  onCellClick,
  onEditTask,
  onDeleteTask,
}: MultiParticipantGridProps) {
  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });

  const days = useMemo(() => {
    return eachDayOfInterval({ start: currentWeekStart, end: weekEnd }).filter(
      (d) => !isSaturdayOrSunday(d),
    );
  }, [currentWeekStart, weekEnd]);

  const canGoPrev = isBefore(practiceStart, currentWeekStart);
  const canGoNext = isAfter(practiceEnd, weekEnd);

  const visibleParticipants = useMemo(() => {
    if (showAll) return participants;
    return participants.filter((p) => p.userId === currentUserId);
  }, [participants, currentUserId, showAll]);

  const tasksByUserAndDate = useMemo(() => {
    const map = new Map<string, Map<string, TaskCard[]>>();
    for (const task of tasks) {
      const uid = task.userId;
      const dateKey = task.date;
      if (!map.has(uid)) {
        map.set(uid, new Map());
      }
      const dateMap = map.get(uid)!;
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, []);
      }
      dateMap.get(dateKey)!.push(task);
    }
    return map;
  }, [tasks]);

  const weekLabel = `${format(currentWeekStart, "d MMM", { locale: ru })} — ${format(weekEnd, "d MMM yyyy", { locale: ru })}`;

  const isInPractice = (date: Date) =>
    !isBefore(date, practiceStart) &&
    !isAfter(date, weekEnd > practiceEnd ? practiceEnd : weekEnd);

  const canAddTask = (participantUserId: string) => {
    if (!canEdit) return false;
    if (!currentUserId) return true;
    return participantUserId === currentUserId;
  };

  const canEditTask = (taskUserId: string) => {
    if (!canEdit) return false;
    if (!currentUserId) return true;
    return taskUserId === currentUserId;
  };

  if (visibleParticipants.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onPrevWeek} disabled={!canGoPrev}>
            <ChevronLeft className="h-4 w-4" />
            Предыдущая
          </Button>
          <span className="text-sm font-medium">{weekLabel}</span>
          <Button variant="outline" size="sm" onClick={onNextWeek} disabled={!canGoNext}>
            Следующая
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-center text-sm text-muted-foreground py-8">
          Нет участников для отображения
        </p>
      </div>
    );
  }

  const maxNameLength = Math.max(
    ...visibleParticipants.map((p) => p.userName.length),
    15,
  );
  const nameColWidth = Math.min(Math.max(maxNameLength * 9, 130), 220);

  const dayCount = days.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onPrevWeek} disabled={!canGoPrev}>
          <ChevronLeft className="h-4 w-4" />
          Предыдущая
        </Button>
        <span className="text-sm font-medium">{weekLabel}</span>
        <Button variant="outline" size="sm" onClick={onNextWeek} disabled={!canGoNext}>
          Следующая
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Табличная вёрстка через CSS Grid */}
      <div className="overflow-auto border rounded-none">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `${nameColWidth}px repeat(${dayCount}, 1fr)`,
            minWidth: `${nameColWidth + dayCount * 200}px`,
          }}
        >
          {/* Шапка */}
          <div className="sticky top-0 z-10 bg-background border-b border-border border-r border-border" />

          {days.map((day, idx) => (
            <div
              key={day.toISOString()}
              className={`sticky top-0 z-10 bg-background text-center border-b border-border px-2 py-2 ${
                idx < dayCount - 1 ? "border-r border-border" : ""
              }`}
            >
              <div className="text-xs font-medium text-muted-foreground">
                {format(day, "EE", { locale: ru })}
              </div>
              <div className="text-sm font-semibold">
                {format(day, "d", { locale: ru })}
              </div>
            </div>
          ))}

          {/* Строки участников — каждая ячейка прямой потомок grid */}
          {visibleParticipants.flatMap((participant, pIdx) => {
            const userTasks = tasksByUserAndDate.get(participant.userId);
            const isOwnRow = participant.userId === currentUserId;
            const isLastRow = pIdx === visibleParticipants.length - 1;

            // ФИО слева
            const nameCell = (
              <div
                key={`name-${participant.userId}`}
                className={`flex items-start p-2 text-sm font-medium border-r border-border ${
                  isOwnRow ? "bg-primary/5" : ""
                } ${isLastRow ? "" : "border-b border-border"}`}
              >
                <span className="truncate" title={participant.userName}>
                  {participant.userName}
                </span>
              </div>
            );

            // Ячейки дней
            const dayCells = days.map((day, dIdx) => {
              const dateKey = formatDateKey(day);
              const dayTasks = userTasks?.get(dateKey) ?? [];
              const inRange = isInPractice(day);
              const canAdd = canAddTask(participant.userId);
              const task = dayTasks[0] ?? null;
              const isEditable = task ? canEditTask(task.userId) : false;
              const isLastCol = dIdx === dayCount - 1;
              const key = `cell-${participant.userId}-${day.toISOString()}`;
              const borderClasses = `${isLastRow ? "" : "border-b border-border"} ${isLastCol ? "" : "border-r border-border"}`;

              // Ячейка с задачей
              if (task) {
                return (
                  <div key={key} className={`relative min-h-[90px] ${borderClasses}`}>
                    <Card
                      className="h-full w-full cursor-pointer rounded-none border-0 p-2 transition-colors hover:bg-accent"
                      onClick={() => onCellClick(dateKey, task, participant.userId)}
                    >
                      <div className="flex h-full flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <p className="text-xs font-medium leading-tight line-clamp-3">
                              {task.title}
                            </p>
                            {isEditable && (
                              <div className="flex shrink-0 items-center gap-0.5">
                                    {onEditTask && (
                                      <button
                                        type="button"
                                        className="cursor-pointer rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-accent-foreground/10"
                                        onClick={(e) => { e.stopPropagation(); onEditTask(task); }}
                                        title="Редактировать"
                                      >
                                        <Pencil className="h-3 w-3" />
                                      </button>
                                    )}
                                    {onDeleteTask && (
                                      <button
                                        type="button"
                                        className="cursor-pointer rounded p-0.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        onClick={(e) => { e.stopPropagation(); onDeleteTask(task); }}
                                        title="Удалить"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    )}
                              </div>
                            )}
                          </div>
                          {task.description && (
                            <p className="mt-1 line-clamp-2 text-[10px] text-muted-foreground">
                              {task.description}
                            </p>
                          )}
                        </div>
                        {task.artifactLink && (
                          <div className="mt-auto pt-1">
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>
                );
              }

              // Пустая ячейка с "+"
              if (inRange && canAdd) {
                return (
                  <div key={key} className={`min-h-[90px] ${borderClasses}`}>
                    <button
                      className="flex h-full w-full cursor-pointer items-center justify-center border-0 text-muted-foreground transition-colors hover:border hover:border-primary hover:text-primary"
                      onClick={() => onCellClick(dateKey, null, participant.userId)}
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                );
              }

              // Пустая ячейка
              return (
                <div key={key} className={`min-h-[90px] bg-muted/10 ${borderClasses}`} />
              );
            });

            return [nameCell, ...dayCells];
          })}
        </div>
      </div>
    </div>
  );
}