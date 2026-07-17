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
import { ChevronLeft, ChevronRight, Plus, ExternalLink } from "lucide-react";

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
}

function isSaturdayOrSunday(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function formatDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/**
 * Multi‑participant grid:
 * - Слева — ФИО участников (по вертикали)
 * - Сверху — дни недели (пн–пт)
 * - Каждая ячейка — задача(и) конкретного студента на конкретный день
 *
 * Если showAll=false — отображается только строка currentUserId.
 * Если showAll=true — отображаются все участники.
 */
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
}: MultiParticipantGridProps) {
  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });

  // Будние дни
  const days = useMemo(() => {
    return eachDayOfInterval({ start: currentWeekStart, end: weekEnd }).filter(
      (d) => !isSaturdayOrSunday(d),
    );
  }, [currentWeekStart, weekEnd]);

  const canGoPrev = isBefore(practiceStart, currentWeekStart);
  const canGoNext = isAfter(practiceEnd, weekEnd);

  // Студенты для отображения: только текущий или все
  const visibleParticipants = useMemo(() => {
    if (showAll) return participants;
    return participants.filter((p) => p.userId === currentUserId);
  }, [participants, currentUserId, showAll]);

  // Группировка задач: userId → date → TaskCard[]
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

  // Определяем, можно ли добавлять задачу для данного пользователя
  const canAddTask = (participantUserId: string) => {
    if (!canEdit) return false;
    return participantUserId === currentUserId;
  };

  if (visibleParticipants.length === 0) {
    return (
      <div className="space-y-4">
        {/* Навигация */}
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

  // Определяем ширину колонки с ФИО
  const maxNameLength = Math.max(
    ...visibleParticipants.map((p) => p.userName.length),
    15, // минимум
  );
  const nameColWidth = Math.min(Math.max(maxNameLength * 9, 130), 220);

  return (
    <div className="space-y-4">
      {/* Навигация по неделям */}
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

      {/* Сетка с фиксированной табличной вёрсткой */}
      <div className="overflow-auto">
        <div
          className="grid gap-0"
          style={{
            gridTemplateColumns: `${nameColWidth}px repeat(${days.length}, 1fr)`,
            minWidth: `${nameColWidth + days.length * 200}px`,
          }}
        >
          {/* Шапка: пустая ячейка + дни */}
          <div className="sticky top-0 z-10 bg-background p-2 border-b border-r" />

          {days.map((day, idx) => (
            <div
              key={day.toISOString()}
              className="sticky top-0 z-10 bg-background text-center border-b px-2 py-2"
              style={{ borderRight: idx < days.length - 1 ? "1px solid hsl(var(--border))" : "none" }}
            >
              <div className="text-xs font-medium text-muted-foreground">
                {format(day, "EE", { locale: ru })}
              </div>
              <div className="text-sm font-semibold">
                {format(day, "d", { locale: ru })}
              </div>
            </div>
          ))}

          {/* Строки участников */}
          {visibleParticipants.map((participant, pIdx) => {
            const userTasks = tasksByUserAndDate.get(participant.userId);
            const isOwnRow = participant.userId === currentUserId;

            return (
              <div key={participant.userId} className="contents">
                {/* ФИО слева */}
                <div
                  className={`flex items-start p-2 text-sm font-medium border-r border-b ${
                    isOwnRow ? "bg-primary/5" : ""
                  }`}
                  style={{
                    borderBottom: pIdx < visibleParticipants.length - 1 ? "1px solid hsl(var(--border))" : "none",
                  }}
                >
                  <span className="truncate" title={participant.userName}>
                    {participant.userName}
                  </span>
                </div>

                {/* Ячейки дней */}
                {days.map((day, dIdx) => {
                  const dateKey = formatDateKey(day);
                  const dayTasks = userTasks?.get(dateKey) ?? [];
                  const inRange = isInPractice(day);
                  const canAdd = canAddTask(participant.userId);

                  return (
                    <div
                      key={`${participant.userId}-${day.toISOString()}`}
                      className="min-h-[90px] p-1 border-b"
                      style={{
                        borderRight: dIdx < days.length - 1 ? "1px solid hsl(var(--border))" : "none",
                        borderBottom: pIdx < visibleParticipants.length - 1 ? "1px solid hsl(var(--border))" : "none",
                      }}
                    >
                      {dayTasks.length > 0 ? (
                        <div className="space-y-1">
                          {dayTasks.map((task) => (
                            <Card
                              key={task.id}
                              className="cursor-pointer p-1.5 transition-colors hover:bg-accent"
                              onClick={() => onCellClick(dateKey, task, participant.userId)}
                            >
                              <p className="truncate text-xs font-medium">{task.title}</p>
                              {task.artifactLink && (
                                <ExternalLink className="mt-0.5 h-3 w-3 text-muted-foreground" />
                              )}
                            </Card>
                          ))}
                          {inRange && canAdd && (
                            <button
                              className="flex w-full items-center justify-center rounded-md border border-dashed p-0.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                              onClick={() => onCellClick(dateKey, null, participant.userId)}
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ) : inRange && canAdd ? (
                        <button
                          className="flex h-full w-full items-center justify-center rounded-md border border-dashed text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                          onClick={() => onCellClick(dateKey, null, participant.userId)}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      ) : (
                        <div className="h-full rounded-md bg-muted/20" />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}