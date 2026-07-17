import prisma from '../db/prisma.js';
import { User } from '../generated/prisma/client.js';

export const userRepository = {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  },

  async create(email: string, passwordHash: string): Promise<User> {
    return prisma.user.create({
      data: {
        email,
        passwordHash,
      },
    });
  },

  async createAdmin(email: string, passwordHash: string): Promise<User> {
    return prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'ADMIN',
      },
    });
  },

  async updateRole(userId: string, role: string): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  },

  async findByVerificationToken(token: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: {
        verificationToken: token,
        tokenExpiresAt: {
          gt: new Date(),
        },
      },
    });
  },

  async updateVerificationToken(
    userId: string,
    token: string,
    expiresAt: Date
  ): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: {
        verificationToken: token,
        tokenExpiresAt: expiresAt,
      },
    });
  },

  async verifyEmail(userId: string): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: {
        isEmailVerified: true,
        verifiedAt: new Date(),
        verificationToken: null,
        tokenExpiresAt: null,
      },
    });
  },

  async findByPasswordResetToken(token: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiresAt: {
          gt: new Date(),
        },
      },
    });
  },

  async setPasswordResetToken(
    userId: string,
    token: string,
    expiresAt: Date
  ): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: {
        passwordResetToken: token,
        passwordResetExpiresAt: expiresAt,
      },
    });
  },

  async resetPassword(userId: string, passwordHash: string): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    });
  },
};