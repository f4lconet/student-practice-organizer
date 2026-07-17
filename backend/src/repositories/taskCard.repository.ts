import prisma from '../db/prisma.js';
import { TaskCard } from '../generated/prisma/client.js';

export const taskCardRepository = {
  async findByUserAndRange(userId: string, cohortId: string, from: Date, to: Date): Promise<TaskCard[]> {
    return prisma.taskCard.findMany({
      where: { userId, cohortId, date: { gte: from, lte: to } },
      orderBy: { date: 'asc' },
    });
  },

  async findByCohortAndRange(cohortId: string, from: Date, to: Date): Promise<(TaskCard & { user: { id: string; email: string } })[]> {
    return prisma.taskCard.findMany({
      where: { cohortId, date: { gte: from, lte: to } },
      include: { user: { select: { id: true, email: true } } },
      orderBy: [{ userId: 'asc' }, { date: 'asc' }],
    });
  },

  async findById(id: string): Promise<TaskCard | null> {
    return prisma.taskCard.findUnique({ where: { id } });
  },

  async create(data: {
    userId: string;
    cohortId: string;
    date: Date;
    title: string;
    description?: string;
    artifactLink?: string;
  }): Promise<TaskCard> {
    return prisma.taskCard.create({ data });
  },

  async update(id: string, data: Partial<{
    title: string;
    description: string;
    artifactLink: string;
  }>): Promise<TaskCard> {
    return prisma.taskCard.update({ where: { id }, data });
  },

  async delete(id: string): Promise<TaskCard> {
    return prisma.taskCard.delete({ where: { id } });
  },
};