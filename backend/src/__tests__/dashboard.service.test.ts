import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '../db/prisma.js';
import { dashboardService } from '../services/dashboard.service.js';

const mockApplications: any[] = [
  {
    id: 'app-1',
    userId: 'user-1',
    cohortId: 'active-cohort',
    roleId: 'role-1',
    status: 'approved',
    reviewComment: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    cohort: { id: 'active-cohort', name: '2026' },
    role: { id: 'role-1', name: 'Frontend' },
  },
  {
    id: 'app-2',
    userId: 'user-1',
    cohortId: 'old-cohort',
    roleId: null,
    status: 'rejected',
    reviewComment: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    cohort: { id: 'old-cohort', name: '2025' },
    role: null,
  },
];

describe('DashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMyDashboard', () => {
    it('should return dashboard with tasksTabAvailable=true when user has approved application in active cohort', async () => {
      vi.mocked(prisma.application.findMany).mockResolvedValueOnce(mockApplications);
      vi.mocked(prisma.cohort.findFirst).mockResolvedValueOnce({
        id: 'active-cohort',
        name: '2026',
        applicationStart: new Date('2026-01-01'),
        applicationEnd: new Date('2026-12-31'),
        practiceStart: new Date('2026-06-01'),
        practiceEnd: new Date('2026-08-31'),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await dashboardService.getMyDashboard('user-1');
      expect(result.applications).toHaveLength(2);
      expect(result.tasksTabAvailable).toBe(true);
    });

    it('should return tasksTabAvailable=false when no approved application in active cohort', async () => {
      vi.mocked(prisma.application.findMany).mockResolvedValueOnce(mockApplications.filter(a => a.status !== 'approved'));
      vi.mocked(prisma.cohort.findFirst).mockResolvedValueOnce({
        id: 'active-cohort',
        name: '2026',
        applicationStart: new Date('2026-01-01'),
        applicationEnd: new Date('2026-12-31'),
        practiceStart: new Date('2026-06-01'),
        practiceEnd: new Date('2026-08-31'),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await dashboardService.getMyDashboard('user-1');
      expect(result.tasksTabAvailable).toBe(false);
    });

    it('should handle missing active cohort gracefully', async () => {
      vi.mocked(prisma.application.findMany).mockResolvedValueOnce(mockApplications);
      vi.mocked(prisma.cohort.findFirst).mockRejectedValueOnce(new Error('No active cohort'));

      const result = await dashboardService.getMyDashboard('user-1');
      expect(result.tasksTabAvailable).toBe(false);
      expect(result.applications).toHaveLength(2);
    });
  });
});