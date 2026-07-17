import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '../db/prisma.js';
import { cohortService } from '../services/cohort.service.js';

const mockCohort = {
  id: 'cohort-1',
  name: '2026',
  applicationStart: new Date('2026-01-01'),
  applicationEnd: new Date('2026-03-01'),
  practiceStart: new Date('2026-06-01'),
  practiceEnd: new Date('2026-08-31'),
  createdAt: new Date(),
  updatedAt: new Date(),
  roles: [],
  surveyFields: [],
  testTask: null,
};

describe('CohortService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a cohort successfully', async () => {
      vi.mocked(prisma.cohort.findFirst).mockResolvedValueOnce(null);
      vi.mocked(prisma.cohort.create).mockResolvedValueOnce(mockCohort);
      vi.mocked(prisma.cohort.findMany).mockResolvedValueOnce([]);

      const result = await cohortService.create({
        name: '2026',
        applicationStart: '2026-01-01',
        applicationEnd: '2026-03-01',
        practiceStart: '2026-06-01',
        practiceEnd: '2026-08-31',
      });

      expect(result.name).toBe('2026');
    });

    it('should throw ValidationError when applicationStart >= applicationEnd', async () => {
      await expect(cohortService.create({
        name: '2026',
        applicationStart: '2026-03-01',
        applicationEnd: '2026-01-01',
        practiceStart: '2026-06-01',
        practiceEnd: '2026-08-31',
      })).rejects.toThrow('The application submission deadline must be later than the start date');
    });

    it('should throw ValidationError when practiceStart >= practiceEnd', async () => {
      await expect(cohortService.create({
        name: '2026',
        applicationStart: '2026-01-01',
        applicationEnd: '2026-03-01',
        practiceStart: '2026-08-31',
        practiceEnd: '2026-06-01',
      })).rejects.toThrow('The internship end date must be later than the start date');
    });

    it('should throw ValidationError when applicationEnd > practiceStart', async () => {
      await expect(cohortService.create({
        name: '2026',
        applicationStart: '2026-01-01',
        applicationEnd: '2026-06-15',
        practiceStart: '2026-06-01',
        practiceEnd: '2026-08-31',
      })).rejects.toThrow('The application deadline must be prior to the start of the internship');
    });

    it('should throw ConflictError for duplicate name', async () => {
      vi.mocked(prisma.cohort.findFirst).mockResolvedValueOnce(mockCohort);
      await expect(cohortService.create({
        name: '2026',
        applicationStart: '2026-01-01',
        applicationEnd: '2026-03-01',
        practiceStart: '2026-06-01',
        practiceEnd: '2026-08-31',
      })).rejects.toThrow('already exists');
    });
  });

  describe('findAll', () => {
    it('should return all cohorts', async () => {
      vi.mocked(prisma.cohort.findMany).mockResolvedValueOnce([mockCohort]);
      const result = await cohortService.findAll();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('2026');
    });
  });

  describe('findById', () => {
    it('should return a cohort by id', async () => {
      vi.mocked(prisma.cohort.findUnique).mockResolvedValueOnce(mockCohort);
      const result = await cohortService.findById('cohort-1');
      expect(result.name).toBe('2026');
    });

    it('should throw NotFoundError for non-existent cohort', async () => {
      vi.mocked(prisma.cohort.findUnique).mockResolvedValueOnce(null);
      await expect(cohortService.findById('invalid-id')).rejects.toThrow('Cohort not found');
    });
  });

  describe('update', () => {
    it('should update a cohort', async () => {
      vi.mocked(prisma.cohort.findUnique).mockResolvedValueOnce(mockCohort);
      vi.mocked(prisma.cohort.update).mockResolvedValueOnce({ ...mockCohort, name: '2026-updated' });

      const result = await cohortService.update('cohort-1', { name: '2026-updated' });
      expect(result.name).toBe('2026-updated');
    });

    it('should throw NotFoundError for non-existent cohort', async () => {
      vi.mocked(prisma.cohort.findUnique).mockResolvedValueOnce(null);
      await expect(cohortService.update('invalid-id', { name: 'test' })).rejects.toThrow('Cohort not found');
    });

    it('should validate date ranges on update', async () => {
      vi.mocked(prisma.cohort.findUnique).mockResolvedValueOnce(mockCohort);
      await expect(cohortService.update('cohort-1', {
        applicationStart: '2026-03-01',
        applicationEnd: '2026-01-01',
      })).rejects.toThrow('The application submission deadline must be later than the start date');
    });
  });

  describe('delete', () => {
    it('should delete a cohort', async () => {
      vi.mocked(prisma.cohort.findUnique).mockResolvedValueOnce(mockCohort);
      vi.mocked(prisma.cohort.delete).mockResolvedValueOnce(mockCohort);
      await cohortService.delete('cohort-1');
      expect(prisma.cohort.delete).toHaveBeenCalledWith({ where: { id: 'cohort-1' } });
    });

    it('should throw NotFoundError for non-existent cohort', async () => {
      vi.mocked(prisma.cohort.findUnique).mockResolvedValueOnce(null);
      await expect(cohortService.delete('invalid-id')).rejects.toThrow('Cohort not found');
    });
  });

  describe('findActive', () => {
    it('should return active cohort', async () => {
      vi.mocked(prisma.cohort.findFirst).mockResolvedValueOnce(mockCohort);
      const result = await cohortService.findActive();
      expect(result.name).toBe('2026');
    });

    it('should throw NotFoundError when no active cohort', async () => {
      vi.mocked(prisma.cohort.findFirst).mockResolvedValueOnce(null);
      await expect(cohortService.findActive()).rejects.toThrow('Active cohort not found');
    });
  });
});