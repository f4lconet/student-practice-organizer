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
  isSameDay,
  format,
} from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { TaskCard } from "@/entities";

interface WeekGridProps {
  currentWeekStart: Date;
  practiceStart: Date;
  practiceEnd: Date;
  tasks: TaskCard[];
  userId: string;
  showAll: boolean;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onCellClick: (date: string, task: TaskCard | null) => void;
}

function isSaturdayOrSunday(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function formatDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function WeekGrid({
  currentWeekStart,
  practiceStart,
  practiceEnd,
  tasks,
  userId,
  showAll,
  onPrevWeek,
  onNextWeek,
  onCellClick,
}: WeekGridProps) {
  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });

  // Будние дни недели
  const days = useMemo(() => {
    return eachDayOfInterval({ start: currentWeekStart, end: weekEnd }).filter(
      (d) => !isSaturdayOrSunday(d),
    );
  }, [currentWeekStart, weekEnd]);

  // Нельзя листать раньше practiceStart
  const canGoPrev = isBefore(practiceStart, currentWeekStart);
  // Нельзя листать позже practiceEnd
  const canGoNext = isAfter(practiceEnd, weekEnd);

  // Группировка задач по дате
  const tasksByDate = useMemo(() => {
    const map = new Map<string, TaskCard[]>();
    for (const task of tasks) {
      const key = task.date;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(task);
    }
    return map;
  }, [tasks]);

  const weekLabel = `${format(currentWeekStart, "d MMM", { locale: ru })} — ${format(weekEnd, "d MMM yyyy", { locale: ru })}`;

  // День недели считается рабочим, если он в пределах практики
  const isInPractice = (date: Date) =>
    !isBefore(date, practiceStart) && !isAfter(date, weekEnd > practiceEnd ? practiceEnd : weekEnd);

  return (
    <div className="space-y-4">
      {/* Навигация по неделям */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevWeek}
          disabled={!canGoPrev}
        >
          <ChevronLeft className="h-4 w-4" />
          Предыдущая
        </Button>
        <span className="text-sm font-medium">{weekLabel}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={onNextWeek}
          disabled={!canGoNext}
        >
          Следующая
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Сетка */}
      <div className="grid grid-cols-5 gap-2">
        {/* Заголовки дней */}
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className="text-center text-xs font-medium text-muted-foreground"
          >
            {format(day, "EE", { locale: ru })}
            <br />
            <span className="text-sm">{format(day, "d", { locale: ru })}</span>
          </div>
        ))}

        {/* Ячейки дней */}
        {days.map((day) => {
          const dateKey = formatDateKey(day);
          const dayTasks = tasksByDate.get(dateKey) ?? [];
          const isInRange = isInPractice(day);

          return (
            <div key={day.toISOString()} className="min-h-[100px]">
              {dayTasks.length > 0 ? (
                // Заполненная ячейка
                <div className="space-y-1">
                  {dayTasks.map((task) => {
                    const isOwn = task.userId === userId;
                    return (
                      <Card
                        key={task.id}
                        className="cursor-pointer p-2 transition-colors hover:bg-accent"
                        onClick={() => onCellClick(dateKey, task)}
                      >
                        <p className="truncate text-xs font-medium">{task.title}</p>
                        {task.artifactLink && (
                          <ExternalLink className="mt-0.5 h-3 w-3 text-muted-foreground" />
                        )}
                      </Card>
                    );
                  })}
                  {isInRange && !showAll && (
                    <button
                      className="flex w-full items-center justify-center rounded-md border border-dashed p-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                      onClick={() => onCellClick(dateKey, null)}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ) : isInRange && !showAll ? (
                // Пустая ячейка с кнопкой "+"
                <button
                  className="flex h-full w-full items-center justify-center rounded-md border border-dashed text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  onClick={() => onCellClick(dateKey, null)}
                >
                  <Plus className="h-5 w-5" />
                </button>
              ) : (
                // Пустая ячейка вне диапазона или в режиме "показать всех"
                <div className="h-full rounded-md bg-muted/30" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}