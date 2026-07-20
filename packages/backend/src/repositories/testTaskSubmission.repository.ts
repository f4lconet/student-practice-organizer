import prisma from '../db/prisma.js';
import { TestTaskSubmission } from '../generated/prisma/client.js';

export const testTaskSubmissionRepository = {
  async findByApplication(applicationId: string): Promise<TestTaskSubmission | null> {
    return prisma.testTaskSubmission.findUnique({
      where: { applicationId },
    });
  },

  async findByTestTask(testTaskId: string): Promise<TestTaskSubmission[]> {
    return prisma.testTaskSubmission.findMany({
      where: { testTaskId },
      include: {
        application: {
          include: {
            user: true,
            fieldValues: { include: { field: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async upsert(testTaskId: string, applicationId: string, content: string): Promise<TestTaskSubmission> {
    return prisma.testTaskSubmission.upsert({
      where: { applicationId },
      update: { content },
      create: { testTaskId, applicationId, content },
    });
  },
};