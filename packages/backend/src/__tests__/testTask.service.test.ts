import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '../db/prisma.js';
import { testTaskService } from '../services/testTask.service.js';

const mockTestTask: any = {
  id: 'tt-1',
  cohortId: 'cohort-1',
  content: 'Build a REST API',
  publishedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPublishedTask = { ...mockTestTask, publishedAt: new Date() };

const mockApplication: any = {
  id: 'app-1',
  userId: 'user-1',
  cohortId: 'cohort-1',
  status: 'pending',
  user: { id: 'user-1', email: 'test@example.com' },
};

describe('TestTaskService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('upsert', () => {
    it('should create a new test task', async () => {
      vi.mocked(prisma.testTask.upsert).mockResolvedValueOnce(mockTestTask);
      const result = await testTaskService.upsert('cohort-1', 'Build a REST API');
      expect(result.content).toBe('Build a REST API');
    });

    it('should update existing test task', async () => {
      vi.mocked(prisma.testTask.upsert).mockResolvedValueOnce({ ...mockTestTask, content: 'Updated content' });
      const result = await testTaskService.upsert('cohort-1', 'Updated content');
      expect(result.content).toBe('Updated content');
    });
  });

  describe('publish', () => {
    it('should publish a test task and notify applicants', async () => {
      vi.mocked(prisma.testTask.update).mockResolvedValueOnce(mockPublishedTask);
      vi.mocked(prisma.application.findMany).mockResolvedValueOnce([mockApplication]);

      const result = await testTaskService.publish('cohort-1');
      expect(result.publishedAt).toBeDefined();
    });
  });

  describe('getForApplication', () => {
    it('should return published test task for authorized user', async () => {
      vi.mocked(prisma.application.findUnique).mockResolvedValueOnce(mockApplication);
      vi.mocked(prisma.testTask.findUnique).mockResolvedValueOnce(mockPublishedTask);

      const result = await testTaskService.getForApplication('app-1', 'user-1');
      expect(result.published).toBe(true);
      expect(result.content).toBe('Build a REST API');
    });

    it('should return unpublished status when task not published', async () => {
      vi.mocked(prisma.application.findUnique).mockResolvedValueOnce(mockApplication);
      vi.mocked(prisma.testTask.findUnique).mockResolvedValueOnce(mockTestTask);

      const result = await testTaskService.getForApplication('app-1', 'user-1');
      expect(result.published).toBe(false);
    });

    it('should throw NotFoundError for non-existent application', async () => {
      vi.mocked(prisma.application.findUnique).mockResolvedValueOnce(null);
      await expect(testTaskService.getForApplication('invalid', 'user-1')).rejects.toThrow('Application not found');
    });

    it('should throw ForbiddenError for unauthorized user', async () => {
      vi.mocked(prisma.application.findUnique).mockResolvedValueOnce(mockApplication);
      await expect(testTaskService.getForApplication('app-1', 'other-user')).rejects.toThrow('Access denied');
    });
  });
});