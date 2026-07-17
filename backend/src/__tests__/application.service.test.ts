import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '../db/prisma.js';
import { applicationService } from '../services/application.service.js';

const mockApplication: any = {
  id: 'app-1',
  userId: 'user-1',
  cohortId: 'cohort-1',
  roleId: null,
  status: 'pending',
  reviewComment: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  user: { id: 'user-1', email: 'test@example.com' },
  cohort: { id: 'cohort-1', name: '2026' },
  role: null,
  fieldValues: [],
};

const mockRole = {
  id: 'role-1',
  cohortId: 'cohort-1',
  name: 'Frontend',
  createdAt: new Date(),
  cohort: { id: 'cohort-1' },
};

describe('ApplicationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('submit', () => {
    it('should submit an application successfully', async () => {
      vi.mocked(prisma.application.findFirst).mockResolvedValueOnce(null);
      vi.mocked(prisma.application.create).mockResolvedValueOnce(mockApplication);

      const result = await applicationService.submit('user-1', 'cohort-1', [
        { fieldId: 'field-1', value: 'Test Value' },
      ]);

      expect(result.status).toBe('pending');
    });

    it('should throw ConflictError if application already exists', async () => {
      vi.mocked(prisma.application.findFirst).mockResolvedValueOnce(mockApplication);
      await expect(applicationService.submit('user-1', 'cohort-1', [])).rejects.toThrow('Заявка в эту когорту уже подана');
    });
  });

  describe('getPrefillData', () => {
    it('should return prefill data from latest application', async () => {
      vi.mocked(prisma.application.findFirst).mockResolvedValueOnce({
        ...mockApplication,
        fieldValues: [
          { field: { label: 'ФИО' }, value: 'Иван Иванов' },
          { field: { label: 'Группа' }, value: 'ПИ-301' },
        ],
      });

      const result = await applicationService.getPrefillData('user-1');
      expect(result['ФИО']).toBe('Иван Иванов');
      expect(result['Группа']).toBe('ПИ-301');
    });

    it('should return empty object if no prior applications', async () => {
      vi.mocked(prisma.application.findFirst).mockResolvedValueOnce(null);
      const result = await applicationService.getPrefillData('user-1');
      expect(result).toEqual({});
    });
  });

  describe('findAllByUser', () => {
    it('should return all applications for user', async () => {
      vi.mocked(prisma.application.findMany).mockResolvedValueOnce([mockApplication]);
      const result = await applicationService.findAllByUser('user-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('findAllByCohort', () => {
    it('should return all applications for cohort', async () => {
      vi.mocked(prisma.application.findMany).mockResolvedValueOnce([mockApplication]);
      const result = await applicationService.findAllByCohort('cohort-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('approve', () => {
    it('should approve an application', async () => {
      vi.mocked(prisma.application.findUnique).mockResolvedValueOnce(mockApplication);
      vi.mocked(prisma.cohortRole.findUnique).mockResolvedValueOnce(mockRole);
      vi.mocked(prisma.application.update).mockResolvedValueOnce({
        ...mockApplication,
        status: 'approved',
        roleId: 'role-1',
      });

      const result = await applicationService.approve('app-1', 'role-1');
      expect(result.status).toBe('approved');
    });

    it('should throw NotFoundError if application not found', async () => {
      vi.mocked(prisma.application.findUnique).mockResolvedValueOnce(null);
      await expect(applicationService.approve('invalid-id', 'role-1')).rejects.toThrow('Application not found');
    });

    it('should throw ValidationError if roleId does not belong to cohort', async () => {
      vi.mocked(prisma.application.findUnique).mockResolvedValueOnce(mockApplication);
      vi.mocked(prisma.cohortRole.findUnique).mockResolvedValueOnce({
        ...mockRole,
        cohortId: 'different-cohort',
      });

      await expect(applicationService.approve('app-1', 'role-1')).rejects.toThrow('roleId does not belong to this cohort');
    });
  });

  describe('reject', () => {
    it('should reject an application', async () => {
      vi.mocked(prisma.application.findUnique).mockResolvedValueOnce(mockApplication);
      vi.mocked(prisma.application.update).mockResolvedValueOnce({
        ...mockApplication,
        status: 'rejected',
        reviewComment: 'Not qualified',
      });

      const result = await applicationService.reject('app-1', 'Not qualified');
      expect(result.status).toBe('rejected');
    });

    it('should throw NotFoundError if application not found', async () => {
      vi.mocked(prisma.application.findUnique).mockResolvedValueOnce(null);
      await expect(applicationService.reject('invalid-id')).rejects.toThrow('Application not found');
    });
  });
});