import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '../db/prisma.js';
import { taskCardService } from '../services/taskCard.service.js';

const mockCohort: any = {
  id: 'cohort-1',
  name: '2026',
  applicationStart: new Date('2026-01-01'),
  applicationEnd: new Date('2026-03-01'),
  practiceStart: new Date('2026-06-01'),
  practiceEnd: new Date('2026-08-31'),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockTask: any = {
  id: 'task-1',
  userId: 'user-1',
  cohortId: 'cohort-1',
  date: new Date('2026-06-01'),
  title: 'Research topic',
  description: 'Do initial research',
  artifactLink: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('TaskCardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getWeekGrid', () => {
    it('should return week grid with tasks', async () => {
      vi.mocked(prisma.cohort.findUnique).mockResolvedValueOnce(mockCohort);
      vi.mocked(prisma.taskCard.findMany).mockResolvedValueOnce([mockTask]);

      const result = await taskCardService.getWeekGrid(
        'cohort-1', '2026-06-01', 'user-1', 'PRACTICANT', false,
      );

      expect(result.weekStart).toBe('2026-06-01');
      expect(result.workdays).toHaveLength(5);
    });

    it('should throw NotFoundError for non-existent cohort', async () => {
      vi.mocked(prisma.cohort.findUnique).mockResolvedValueOnce(null);
      await expect(taskCardService.getWeekGrid('invalid', '2026-06-01', 'user-1', 'PRACTICANT', false))
        .rejects.toThrow('Cohort not found');
    });

    it('should throw ValidationError for invalid weekStart', async () => {
      vi.mocked(prisma.cohort.findUnique).mockResolvedValueOnce(mockCohort);
      await expect(taskCardService.getWeekGrid('cohort-1', 'invalid-date', 'user-1', 'PRACTICANT', false))
        .rejects.toThrow('Invalid weekStart date');
    });

    it('should include all users tasks when all=true and role=ADMIN', async () => {
      vi.mocked(prisma.cohort.findUnique).mockResolvedValueOnce(mockCohort);
      vi.mocked(prisma.taskCard.findMany).mockResolvedValueOnce([mockTask]);

      await taskCardService.getWeekGrid('cohort-1', '2026-06-01', 'admin-1', 'ADMIN', true);
      expect(prisma.taskCard.findMany).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a task successfully', async () => {
      vi.mocked(prisma.cohort.findUnique).mockResolvedValueOnce(mockCohort);
      vi.mocked(prisma.taskCard.create).mockResolvedValueOnce(mockTask);

      const result = await taskCardService.create({
        userId: 'user-1',
        cohortId: 'cohort-1',
        date: '2026-06-01',
        title: 'Research topic',
        description: 'Do initial research',
      });

      expect(result.title).toBe('Research topic');
    });

    it('should throw NotFoundError for non-existent cohort', async () => {
      vi.mocked(prisma.cohort.findUnique).mockResolvedValueOnce(null);
      await expect(taskCardService.create({
        userId: 'user-1',
        cohortId: 'invalid',
        date: '2026-06-01',
        title: 'Task',
      })).rejects.toThrow('Cohort not found');
    });

    it('should throw ValidationError for weekend date', async () => {
      vi.mocked(prisma.cohort.findUnique).mockResolvedValueOnce(mockCohort);
      await expect(taskCardService.create({
        userId: 'user-1',
        cohortId: 'cohort-1',
        date: '2026-06-06',
        title: 'Weekend task',
      })).rejects.toThrow('Tasks can only be created for workdays');
    });

    it('should throw ValidationError for date outside practice period', async () => {
      vi.mocked(prisma.cohort.findUnique).mockResolvedValueOnce(mockCohort);
      await expect(taskCardService.create({
        userId: 'user-1',
        cohortId: 'cohort-1',
        date: '2026-09-01',
        title: 'Late task',
      })).rejects.toThrow('Date is outside the practice period');
    });
  });

  describe('update', () => {
    it('should update a task as owner', async () => {
      vi.mocked(prisma.taskCard.findUnique).mockResolvedValueOnce(mockTask);
      vi.mocked(prisma.taskCard.update).mockResolvedValueOnce({ ...mockTask, title: 'Updated' });

      const result = await taskCardService.update('task-1', 'user-1', 'PRACTICANT', { title: 'Updated' });
      expect(result.title).toBe('Updated');
    });

    it('should update a task as admin', async () => {
      vi.mocked(prisma.taskCard.findUnique).mockResolvedValueOnce(mockTask);
      vi.mocked(prisma.taskCard.update).mockResolvedValueOnce({ ...mockTask, title: 'Updated by admin' });

      const result = await taskCardService.update('task-1', 'admin-1', 'ADMIN', { title: 'Updated by admin' });
      expect(result.title).toBe('Updated by admin');
    });

    it('should throw NotFoundError for non-existent task', async () => {
      vi.mocked(prisma.taskCard.findUnique).mockResolvedValueOnce(null);
      await expect(taskCardService.update('invalid', 'user-1', 'PRACTICANT', { title: 'test' }))
        .rejects.toThrow('Task not found');
    });

    it('should throw ForbiddenError when non-owner tries to update', async () => {
      vi.mocked(prisma.taskCard.findUnique).mockResolvedValueOnce(mockTask);
      await expect(taskCardService.update('task-1', 'other-user', 'PRACTICANT', { title: 'test' }))
        .rejects.toThrow('Access denied');
    });
  });

  describe('delete', () => {
    it('should delete a task as owner', async () => {
      vi.mocked(prisma.taskCard.findUnique).mockResolvedValueOnce(mockTask);
      vi.mocked(prisma.taskCard.delete).mockResolvedValueOnce(mockTask);

      await taskCardService.delete('task-1', 'user-1', 'PRACTICANT');
      expect(prisma.taskCard.delete).toHaveBeenCalledWith({ where: { id: 'task-1' } });
    });

    it('should throw NotFoundError for non-existent task', async () => {
      vi.mocked(prisma.taskCard.findUnique).mockResolvedValueOnce(null);
      await expect(taskCardService.delete('invalid', 'user-1', 'PRACTICANT')).rejects.toThrow('Task not found');
    });

    it('should throw ForbiddenError when non-owner tries to delete', async () => {
      vi.mocked(prisma.taskCard.findUnique).mockResolvedValueOnce(mockTask);
      await expect(taskCardService.delete('task-1', 'other-user', 'PRACTICANT')).rejects.toThrow('Access denied');
    });
  });
});