import prisma from '../db/prisma.js';
import { Application } from '../generated/prisma/client.js';

export const applicationRepository = {
  async create(data: {
    userId: string;
    cohortId: string;
    roleId?: string;
    fieldValues: { fieldId: string; value: string }[];
  }): Promise<Application> {
    return prisma.application.create({
      data: {
        userId: data.userId,
        cohortId: data.cohortId,
        roleId: data.roleId,
        fieldValues: { create: data.fieldValues },
      },
      include: { fieldValues: true },
    });
  },

  async findById(id: string) {
    return prisma.application.findUnique({
      where: { id },
      include: { fieldValues: { include: { field: true } }, cohort: true, user: true },
    });
  },

  async findByUserAndCohort(userId: string, cohortId: string): Promise<Application | null> {
    return prisma.application.findFirst({ where: { userId, cohortId } });
  },

  async findAllByUser(userId: string) {
    return prisma.application.findMany({
      where: { userId },
      include: { cohort: true, role: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  async findAllByCohort(cohortId: string) {
    return prisma.application.findMany({
      where: { cohortId },
      include: { user: true, fieldValues: { include: { field: true } } },
      orderBy: { createdAt: 'desc' },
    });
  },

  async findLatestByUser(userId: string) {
    return prisma.application.findFirst({
      where: { userId },
      include: { fieldValues: { include: { field: true } } },
      orderBy: { createdAt: 'desc' },
    });
  },

  async updateStatus(id: string, status: string, data: { roleId?: string; reviewComment?: string } = {}) {
    return prisma.application.update({
      where: { id },
      data: { status, ...data },
      include: { user: true },
    });
  },
};