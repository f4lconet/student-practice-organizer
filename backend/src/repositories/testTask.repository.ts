import prisma from '../db/prisma.js';
import { TestTask } from '../generated/prisma/client.js';

export const testTaskRepository = {
  async findByCohort(cohortId: string): Promise<TestTask | null> {
    return prisma.testTask.findUnique({ where: { cohortId } });
  },

  async upsert(cohortId: string, content: string): Promise<TestTask> {
    return prisma.testTask.upsert({
      where: { cohortId },
      update: { content },
      create: { cohortId, content },
    });
  },

  async publish(cohortId: string): Promise<TestTask> {
    return prisma.testTask.update({
      where: { cohortId },
      data: { publishedAt: new Date() },
    });
  },
};