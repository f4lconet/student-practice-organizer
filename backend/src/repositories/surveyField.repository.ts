import prisma from '../db/prisma.js';
import { SurveyField } from '../generated/prisma/client.js';

export const surveyFieldRepository = {
  async create(data: {
    cohortId: string;
    label: string;
    type: string;
    options?: string | null;
    order: number;
    isRequired?: boolean;
  }): Promise<SurveyField> {
    return prisma.surveyField.create({ data });
  },

  async findByCohort(cohortId: string): Promise<SurveyField[]> {
    return prisma.surveyField.findMany({
      where: { cohortId },
      orderBy: { order: 'asc' },
    });
  },

  async findById(id: string): Promise<SurveyField | null> {
    return prisma.surveyField.findUnique({ where: { id } });
  },

  async update(id: string, data: Partial<{
    label: string; type: string; options: string | null; order: number; isRequired: boolean;
  }>): Promise<SurveyField> {
    return prisma.surveyField.update({ where: { id }, data });
  },

  async delete(id: string): Promise<SurveyField> {
    return prisma.surveyField.delete({ where: { id } });
  },

  async cloneFromCohort(sourceCohortId: string, targetCohortId: string): Promise<void> {
    const fields = await prisma.surveyField.findMany({
      where: { cohortId: sourceCohortId },
      orderBy: { order: 'asc' },
    });

    if (fields.length === 0) return;

    await prisma.surveyField.createMany({
      data: fields.map(({ id, cohortId, createdAt, updatedAt, ...rest }) => ({
        ...rest,
        cohortId: targetCohortId,
      })),
    });
  },

  async createDefaults(cohortId: string, roleNamesCsv: string): Promise<void> {
    await prisma.surveyField.createMany({
      data: [
        { cohortId, label: 'ФИО', type: 'text', order: 1, isRequired: true },
        { cohortId, label: 'Группа/курс', type: 'text', order: 2, isRequired: true },
        { cohortId, label: 'Желаемая роль/трек', type: 'select', options: roleNamesCsv, order: 3, isRequired: true },
        { cohortId, label: 'Стек/технологии', type: 'text', order: 4, isRequired: true },
      ],
    });
  },
};