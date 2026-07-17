import { vi } from 'vitest';

// Mock Prisma client
vi.mock('../db/prisma.js', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    cohort: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    application: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    surveyField: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      createMany: vi.fn(),
    },
    cohortRole: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    testTask: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
    studentDocumentData: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    taskCard: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $queryRaw: vi.fn(),
    $disconnect: vi.fn(),
  },
}));

// Mock mail service
vi.mock('../lib/mail.service.js', () => ({
  mailService: {
    sendEmail: vi.fn().mockResolvedValue(undefined),
    createVerificationEmail: vi.fn().mockReturnValue({}),
    createWelcomeEmail: vi.fn().mockReturnValue({}),
    createPasswordResetEmail: vi.fn().mockReturnValue({}),
    createTestTaskPublishedEmail: vi.fn().mockReturnValue({}),
    createApplicationApprovedEmail: vi.fn().mockReturnValue({}),
    createApplicationRejectedEmail: vi.fn().mockReturnValue({}),
    createDocumentReadyEmail: vi.fn().mockReturnValue({}),
    createDocumentRejectedEmail: vi.fn().mockReturnValue({}),
    createDocumentSubmittedEmail: vi.fn().mockReturnValue({}),
  },
}));

// Mock nodemailer
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      sendMail: vi.fn().mockResolvedValue({ messageId: 'test' }),
    }),
  },
}));