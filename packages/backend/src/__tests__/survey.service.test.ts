import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '../db/prisma.js';
import { surveyService } from '../services/survey.service.js';

describe('SurveyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a survey field successfully', async () => {
      const mockField: any = {
        id: 'field-1',
        cohortId: 'cohort-1',
        label: 'ФИО',
        type: 'text',
        options: null,
        order: 1,
        isRequired: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.cohort.findUnique).mockResolvedValueOnce({ id: 'cohort-1' } as any);
      vi.mocked(prisma.surveyField.create).mockResolvedValueOnce(mockField);

      const result = await surveyService.create('cohort-1', {
        label: 'ФИО',
        type: 'text',
        order: 1,
      });

      expect(result.label).toBe('ФИО');
    });

    it('should throw NotFoundError for non-existent cohort', async () => {
      vi.mocked(prisma.cohort.findUnique).mockResolvedValueOnce(null);
      await expect(surveyService.create('invalid', { label: 'Test', type: 'text', order: 1 }))
        .rejects.toThrow('Cohort not found');
    });

    it('should throw ValidationError for invalid type', async () => {
      vi.mocked(prisma.cohort.findUnique).mockResolvedValueOnce({ id: 'cohort-1' } as any);
      await expect(surveyService.create('cohort-1', { label: 'Test', type: 'invalid', order: 1 }))
        .rejects.toThrow('type must be one of');
    });

    it('should throw ValidationError for select type without options', async () => {
      vi.mocked(prisma.cohort.findUnique).mockResolvedValueOnce({ id: 'cohort-1' } as any);
      await expect(surveyService.create('cohort-1', { label: 'Test', type: 'select', order: 1 }))
        .rejects.toThrow('options is required for select fields');
    });
  });

  describe('findByCohort', () => {
    it('should return survey fields for cohort', async () => {
      const mockFields: any[] = [
        { id: 'field-1', cohortId: 'cohort-1', label: 'ФИО', type: 'text', order: 1, isRequired: true },
      ];

      vi.mocked(prisma.cohort.findUnique).mockResolvedValueOnce({ id: 'cohort-1' } as any);
      vi.mocked(prisma.surveyField.findMany).mockResolvedValueOnce(mockFields);

      const result = await surveyService.findByCohort('cohort-1');
      expect(result).toHaveLength(1);
    });

    it('should throw NotFoundError for non-existent cohort', async () => {
      vi.mocked(prisma.cohort.findUnique).mockResolvedValueOnce(null);
      await expect(surveyService.findByCohort('invalid')).rejects.toThrow('Cohort not found');
    });
  });

  describe('update', () => {
    it('should update a survey field', async () => {
      const mockField: any = { id: 'field-1', cohortId: 'cohort-1', label: 'ФИО', type: 'text', order: 1 };

      vi.mocked(prisma.surveyField.findUnique).mockResolvedValueOnce(mockField);
      vi.mocked(prisma.surveyField.update).mockResolvedValueOnce({ ...mockField, label: 'Новое ФИО' });

      const result = await surveyService.update('field-1', { label: 'Новое ФИО' });
      expect(result.label).toBe('Новое ФИО');
    });

    it('should throw NotFoundError for non-existent field', async () => {
      vi.mocked(prisma.surveyField.findUnique).mockResolvedValueOnce(null);
      await expect(surveyService.update('invalid', { label: 'Test' })).rejects.toThrow('Survey field not found');
    });
  });

  describe('delete', () => {
    it('should delete a survey field', async () => {
      const mockField: any = { id: 'field-1', cohortId: 'cohort-1', label: 'ФИО', type: 'text', order: 1 };

      vi.mocked(prisma.surveyField.findUnique).mockResolvedValueOnce(mockField);
      vi.mocked(prisma.surveyField.delete).mockResolvedValueOnce(mockField);

      await surveyService.delete('field-1');
      expect(prisma.surveyField.delete).toHaveBeenCalledWith({ where: { id: 'field-1' } });
    });

    it('should throw NotFoundError for non-existent field', async () => {
      vi.mocked(prisma.surveyField.findUnique).mockResolvedValueOnce(null);
      await expect(surveyService.delete('invalid')).rejects.toThrow('Survey field not found');
    });
  });
});