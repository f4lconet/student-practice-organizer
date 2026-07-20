import prisma from '../db/prisma.js';
import { Cohort } from '../generated/prisma/client.js';

export const cohortRepository = {
  async create(data: {
    name: string;
    applicationStart: Date;
    applicationEnd: Date;
    practiceStart: Date;
    practiceEnd: Date;
  }): Promise<Cohort> {
    return prisma.cohort.create({
      data,
    });
  },

  async findAll(): Promise<Cohort[]> {
    return prisma.cohort.findMany({
      orderBy: { createdAt: 'desc' },
    });
  },

  async findById(id: string): Promise<Cohort | null> {
    return prisma.cohort.findUnique({
      where: { id },
      include: {
        roles: true,
        surveyFields: {
          orderBy: { order: 'asc' },
        },
        testTask: true,
      },
    });
  },

  async update(id: string, data: {
    name?: string;
    applicationStart?: Date;
    applicationEnd?: Date;
    practiceStart?: Date;
    practiceEnd?: Date;
  }): Promise<Cohort> {
    return prisma.cohort.update({
      where: { id },
      data,
    });
  },

  async findActive(): Promise<Cohort | null> {
    const now = new Date();
    // applicationEnd хранится как начало дня (00:00:00.000 UTC),
    // поэтому сравниваем с началом сегодняшнего дня в UTC,
    // чтобы весь день окончания приёма (до 23:59:59) был включён.
    const startOfTodayUTC = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      0, 0, 0, 0,
    ));
    return prisma.cohort.findFirst({
      where: {
        applicationStart: { lte: now },
        applicationEnd: { gte: startOfTodayUTC },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async findAccepting(): Promise<Cohort[]> {
    const now = new Date();
    const startOfTodayUTC = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      0, 0, 0, 0,
    ));
    return prisma.cohort.findMany({
      where: {
        applicationStart: { lte: now },
        applicationEnd: { gte: startOfTodayUTC },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async delete(id: string): Promise<Cohort> {
    return prisma.cohort.delete({
      where: { id },
    });
  },

  async findByName(name: string): Promise<Cohort | null> {
    return prisma.cohort.findFirst({
      where: { name },
    });
  },
};