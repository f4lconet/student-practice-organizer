import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '../db/prisma.js';
import { cohortRoleService } from '../services/cohortRole.service.js';

describe('CohortRoleService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a role successfully', async () => {
      const mockRole: any = { id: 'role-1', cohortId: 'cohort-1', name: 'Frontend', createdAt: new Date() };

      vi.mocked(prisma.cohort.findUnique).mockResolvedValueOnce({ id: 'cohort-1' } as any);
      vi.mocked(prisma.cohortRole.findFirst).mockResolvedValueOnce(null);
      vi.mocked(prisma.cohortRole.create).mockResolvedValueOnce(mockRole);

      const result = await cohortRoleService.create('cohort-1', 'Frontend');
      expect(result.name).toBe('Frontend');
    });

    it('should throw NotFoundError for non-existent cohort', async () => {
      vi.mocked(prisma.cohort.findUnique).mockResolvedValueOnce(null);
      await expect(cohortRoleService.create('invalid', 'Frontend')).rejects.toThrow('Когорта не найдена');
    });

    it('should throw ConflictError for duplicate role name', async () => {
      vi.mocked(prisma.cohort.findUnique).mockResolvedValueOnce({ id: 'cohort-1' } as any);
      vi.mocked(prisma.cohortRole.findFirst).mockResolvedValueOnce({ id: 'role-1' } as any);

      await expect(cohortRoleService.create('cohort-1', 'Frontend')).rejects.toThrow('уже существует');
    });
  });

  describe('findByCohort', () => {
    it('should return roles for cohort', async () => {
      const mockRoles: any[] = [
        { id: 'role-1', cohortId: 'cohort-1', name: 'Frontend', createdAt: new Date() },
      ];

      vi.mocked(prisma.cohort.findUnique).mockResolvedValueOnce({ id: 'cohort-1' } as any);
      vi.mocked(prisma.cohortRole.findMany).mockResolvedValueOnce(mockRoles);

      const result = await cohortRoleService.findByCohort('cohort-1');
      expect(result).toHaveLength(1);
    });

    it('should throw NotFoundError for non-existent cohort', async () => {
      vi.mocked(prisma.cohort.findUnique).mockResolvedValueOnce(null);
      await expect(cohortRoleService.findByCohort('invalid')).rejects.toThrow('Cohort not found');
    });
  });

  describe('findById', () => {
    it('should return a role by id', async () => {
      const mockRole: any = { id: 'role-1', cohortId: 'cohort-1', name: 'Frontend', createdAt: new Date() };
      vi.mocked(prisma.cohortRole.findUnique).mockResolvedValueOnce(mockRole);

      const result = await cohortRoleService.findById('role-1');
      expect(result.name).toBe('Frontend');
    });

    it('should throw NotFoundError for non-existent role', async () => {
      vi.mocked(prisma.cohortRole.findUnique).mockResolvedValueOnce(null);
      await expect(cohortRoleService.findById('invalid')).rejects.toThrow('Role not found');
    });
  });

  describe('delete', () => {
    it('should delete a role', async () => {
      const mockRole: any = { id: 'role-1', cohortId: 'cohort-1', name: 'Frontend', createdAt: new Date() };
      vi.mocked(prisma.cohortRole.findUnique).mockResolvedValueOnce(mockRole);
      vi.mocked(prisma.cohortRole.delete).mockResolvedValueOnce(mockRole);

      await cohortRoleService.delete('role-1');
      expect(prisma.cohortRole.delete).toHaveBeenCalledWith({ where: { id: 'role-1' } });
    });

    it('should throw NotFoundError for non-existent role', async () => {
      vi.mocked(prisma.cohortRole.findUnique).mockResolvedValueOnce(null);
      await expect(cohortRoleService.delete('invalid')).rejects.toThrow('Role not found');
    });
  });

  describe('deleteMany', () => {
    it('should delete all roles for a cohort', async () => {
      vi.mocked(prisma.cohort.findUnique).mockResolvedValueOnce({ id: 'cohort-1' } as any);
      vi.mocked(prisma.cohortRole.deleteMany).mockResolvedValueOnce({ count: 3 });

      const result = await cohortRoleService.deleteMany('cohort-1');
      expect(result.count).toBe(3);
    });

    it('should throw NotFoundError for non-existent cohort', async () => {
      vi.mocked(prisma.cohort.findUnique).mockResolvedValueOnce(null);
      await expect(cohortRoleService.deleteMany('invalid')).rejects.toThrow('Cohort not found');
    });
  });
});