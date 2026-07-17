import prisma from '../db/prisma.js';
import { CohortRole } from '../generated/prisma/client.js';

export const cohortRoleRepository = {
  async create(cohortId: string, name: string): Promise<CohortRole> {
    return prisma.cohortRole.create({
      data: {
        cohortId,
        name,
      },
    });
  },

  async findByCohort(cohortId: string): Promise<CohortRole[]> {
    return prisma.cohortRole.findMany({
      where: { cohortId },
      orderBy: { createdAt: 'asc' },
    });
  },

  async findById(id: string): Promise<CohortRole | null> {
    return prisma.cohortRole.findUnique({
      where: { id },
      include: {
        cohort: true,
      },
    });
  },

  async findByName(cohortId: string, name: string): Promise<CohortRole | null> {
    return prisma.cohortRole.findFirst({
      where: {
        cohortId,
        name,
      },
    });
  },

  async delete(id: string): Promise<CohortRole> {
    return prisma.cohortRole.delete({
      where: { id },
    });
  },

  async deleteMany(cohortId: string): Promise<{ count: number }> {
    return prisma.cohortRole.deleteMany({
      where: { cohortId },
    });
  },
};