import { taskCardRepository } from '../repositories/taskCard.repository.js';
import { studentDocumentDataRepository } from '../repositories/studentDocumentData.repository.js';
import { cohortRepository } from '../repositories/cohort.repository.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../errors/index.js';

/** Format a Date to yyyy-MM-dd using local timezone */
function formatDateLocal(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeekWorkdays(weekStart: Date): Date[] {
  const days: Date[] = [];
  const cursor = new Date(weekStart);
  for (let i = 0; i < 5; i++) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

/** Normalize a task's date to a yyyy-MM-dd string for safe JSON serialization */
function dateToDateStr(value: Date | string | undefined | null): string {
  if (!value) return '';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (isNaN(d.getTime())) return String(value);
  return formatDateLocal(d);
}

export const taskCardService = {
  async getWeekGrid(
    cohortId: string,
    weekStartStr: string,
    userId: string,
    userRole: string,
    all: boolean,
  ) {
    const cohort = await cohortRepository.findById(cohortId);
    if (!cohort) throw new NotFoundError('Cohort not found');

    const weekStart = new Date(weekStartStr);
    if (isNaN(weekStart.getTime())) {
      throw new ValidationError('Invalid weekStart date');
    }

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const workdays = getWeekWorkdays(weekStart);

    // Filter workdays to stay within cohort practice period
    const validWorkdays = workdays.filter(
      (d) => d >= cohort.practiceStart && d <= cohort.practiceEnd,
    );

    // If no valid workdays, return empty
    if (validWorkdays.length === 0) {
      return { weekStart: weekStartStr, workdays: [] };
    }

    const from = validWorkdays[0];
    const to = validWorkdays[validWorkdays.length - 1];

    let tasks;
    if (all && userRole === 'ADMIN') {
      tasks = await taskCardRepository.findByCohortAndRange(cohortId, from, to);
    } else {
      tasks = await taskCardRepository.findByUserAndRange(userId, cohortId, from, to);
    }

    // Build workdays with their tasks
    const workdaysWithTasks = validWorkdays.map((day) => {
      const dayStr = formatDateLocal(day);
      const dayTasks = tasks.filter((t) => {
        const tDate = t.date instanceof Date ? t.date : new Date(t.date);
        return formatDateLocal(tDate) === dayStr;
      });
      return {
        date: dayStr,
        tasks: dayTasks.map((t) => ({
          id: t.id,
          userId: t.userId,
          cohortId: t.cohortId,
          date: dateToDateStr(t.date),
          title: t.title,
          description: t.description,
          artifactLink: t.artifactLink,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        })),
      };
    });

    return {
      weekStart: weekStartStr,
      cohortName: cohort.name,
      workdays: workdaysWithTasks,
    };
  },

  async getTasksGrid(cohortId: string, weekStartStr: string) {
    const cohort = await cohortRepository.findById(cohortId);
    if (!cohort) throw new NotFoundError('Cohort not found');

    const weekStart = new Date(weekStartStr);
    if (isNaN(weekStart.getTime())) {
      throw new ValidationError('Invalid weekStart date');
    }

    const workdays = getWeekWorkdays(weekStart);

    // Filter workdays to stay within cohort practice period
    const validWorkdays = workdays.filter(
      (d) => d >= cohort.practiceStart && d <= cohort.practiceEnd,
    );

    if (validWorkdays.length === 0) {
      return {
        weekStart: weekStartStr,
        cohortName: cohort.name,
        participants: [],
      };
    }

    const from = validWorkdays[0];
    const to = validWorkdays[validWorkdays.length - 1];

    // Get all tasks for the week
    const tasks = await taskCardRepository.findByCohortAndRange(cohortId, from, to);

    // Get all student document data to extract FIO
    const allDocs = await studentDocumentDataRepository.findByCohort(cohortId);
    const userFioMap = new Map<string, string>();
    for (const doc of allDocs) {
      if (doc.studentFio) {
        userFioMap.set(doc.userId, doc.studentFio);
      }
    }

    // Group tasks by user
    const tasksByUser = new Map<string, typeof tasks>();
    for (const task of tasks) {
      const key = task.userId;
      if (!tasksByUser.has(key)) {
        tasksByUser.set(key, []);
      }
      tasksByUser.get(key)!.push(task);
    }

    // Build participants with workdays
    const participants: any[] = [];
    for (const [userId, userTasks] of tasksByUser) {
      const userEmail = userTasks[0].user?.email || '';
      const userName = userFioMap.get(userId) || userEmail;

      const workdaysWithTasks = validWorkdays.map((day) => {
        const dayStr = formatDateLocal(day);
        const dayTasks = userTasks.filter((t) => {
          const tDate = t.date instanceof Date ? t.date : new Date(t.date);
          return formatDateLocal(tDate) === dayStr;
        });
        return {
          date: dayStr,
          tasks: dayTasks.map((t) => ({
            id: t.id,
            userId: t.userId,
            title: t.title,
            description: t.description,
            artifactLink: t.artifactLink,
            date: dateToDateStr(t.date),
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
          })),
        };
      });

      participants.push({
        userId,
        userName,
        workdays: workdaysWithTasks,
      });
    }

    return {
      weekStart: weekStartStr,
      cohortName: cohort.name,
      participants,
    };
  },

  async getParticipants(cohortId: string) {
    const cohort = await cohortRepository.findById(cohortId);
    if (!cohort) throw new NotFoundError('Cohort not found');

    const docs = await studentDocumentDataRepository.findByCohort(cohortId);

    return docs.map((doc) => ({
      userId: doc.userId,
      userName: doc.studentFio || 'Не указано',
      group: doc.group || null,
    }));
  },

  async create(data: {
    userId: string;
    cohortId: string;
    date: string;
    title: string;
    description?: string;
    artifactLink?: string;
  }) {
    const cohort = await cohortRepository.findById(data.cohortId);
    if (!cohort) throw new NotFoundError('Cohort not found');

    const taskDate = new Date(data.date);
    if (isNaN(taskDate.getTime())) {
      throw new ValidationError('Invalid date');
    }

    // Validate date is within practice period and is a workday (Mon-Fri)
    if (taskDate < cohort.practiceStart || taskDate > cohort.practiceEnd) {
      throw new ValidationError('Date is outside the practice period');
    }
    const dayOfWeek = taskDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      throw new ValidationError('Tasks can only be created for workdays (Mon-Fri)');
    }

    // Check that user doesn't already have a task on this date (one task per day)
    const existingTasks = await taskCardRepository.findByUserAndRange(
      data.userId,
      data.cohortId,
      taskDate,
      taskDate,
    );
    if (existingTasks.length > 0) {
      throw new ValidationError('На этот день уже есть задача. Можно создать только одну задачу в день.');
    }

    // Convert empty strings to undefined to avoid Prisma errors
    const description = data.description?.trim() || undefined;
    const artifactLink = data.artifactLink?.trim() || undefined;

    return taskCardRepository.create({
      userId: data.userId,
      cohortId: data.cohortId,
      date: taskDate,
      title: data.title,
      description,
      artifactLink,
    });
  },

  async update(id: string, userId: string, userRole: string, data: {
    title?: string;
    description?: string;
    artifactLink?: string;
  }) {
    const task = await taskCardRepository.findById(id);
    if (!task) throw new NotFoundError('Task not found');

    if (userRole !== 'ADMIN' && task.userId !== userId) {
      throw new ForbiddenError('Access denied');
    }

    return taskCardRepository.update(id, data);
  },

  async delete(id: string, userId: string, userRole: string) {
    const task = await taskCardRepository.findById(id);
    if (!task) throw new NotFoundError('Task not found');

    if (userRole !== 'ADMIN' && task.userId !== userId) {
      throw new ForbiddenError('Access denied');
    }

    return taskCardRepository.delete(id);
  },
};