import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '../db/prisma.js';
import { authService } from '../services/auth.service.js';

// Mock bcrypt at module level - auth.service uses `import bcrypt from 'bcrypt'`
vi.mock('bcrypt', () => {
  const mockHash = vi.fn().mockResolvedValue('$2b$10$hashedpassword');
  const mockCompare = vi.fn().mockResolvedValue(true);
  return {
    default: {
      hash: mockHash,
      compare: mockCompare,
    },
  };
});

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  passwordHash: '$2b$10$hashedpassword',
  role: 'PRACTICANT',
  isEmailVerified: false,
  verificationToken: null,
  tokenExpiresAt: null,
  verifiedAt: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  passwordResetToken: null,
  passwordResetExpiresAt: null,
};

const mockVerifiedUser = {
  ...mockUser,
  isEmailVerified: true,
  verifiedAt: new Date('2026-01-01'),
};

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.user.create).mockResolvedValueOnce(mockUser);
      vi.mocked(prisma.user.update).mockResolvedValueOnce(mockUser);

      const result = await authService.register('test@example.com', 'password123');

      expect(result.email).toBe('test@example.com');
      expect(result.token).toBeDefined();
      expect(result.message).toContain('Registration successful');
    });

    it('should throw ValidationError for empty email', async () => {
      await expect(authService.register('', 'password123')).rejects.toThrow('Email is required');
    });

    it('should throw ValidationError for short password', async () => {
      await expect(authService.register('test@example.com', 'short')).rejects.toThrow('Minimum password length is 8');
    });

    it('should throw ConflictError for existing email', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser);
      await expect(authService.register('test@example.com', 'password123')).rejects.toThrow('User already exists');
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockVerifiedUser);

      const result = await authService.login('test@example.com', 'password123');

      expect(result.token).toBeDefined();
      expect(result.email).toBe('test@example.com');
    });

    it('should throw ValidationError for empty credentials', async () => {
      await expect(authService.login('', '')).rejects.toThrow('Email and password is required');
    });

    it('should throw AuthenticationError for incorrect password', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockVerifiedUser);
      // Need to await import because mock factory provides default export only
      const bcryptModule: any = await import('bcrypt');
      bcryptModule.default.compare.mockResolvedValueOnce(false);

      await expect(authService.login('test@example.com', 'wrongpassword')).rejects.toThrow('Incorrect password');
    });

    it('should throw AuthenticationError for unverified email', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser);

      await expect(authService.login('test@example.com', 'password123')).rejects.toThrow('Please verify your email');
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser);
      const profile = await authService.getUserProfile('user-1');
      expect(profile.email).toBe('test@example.com');
      expect(profile.id).toBe('user-1');
    });

    it('should throw AuthenticationError for non-existent user', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
      await expect(authService.getUserProfile('invalid-id')).rejects.toThrow('User not found');
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(mockUser);
      vi.mocked(prisma.user.update).mockResolvedValueOnce(mockVerifiedUser);

      const result = await authService.verifyEmail('valid-token');
      expect(result.isEmailVerified).toBe(true);
    });

    it('should throw ValidationError for empty token', async () => {
      await expect(authService.verifyEmail('')).rejects.toThrow('Verification token is required');
    });

    it('should throw ValidationError for invalid token', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(null);
      await expect(authService.verifyEmail('invalid-token')).rejects.toThrow('Invalid or expired verification token');
    });
  });

  describe('resendVerificationEmail', () => {
    it('should resend verification email', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser);
      vi.mocked(prisma.user.update).mockResolvedValueOnce(mockUser);

      const result = await authService.resendVerificationEmail('test@example.com');
      expect(result.message).toBe('Verification email has been resent');
    });

    it('should throw ValidationError for non-existent user', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
      await expect(authService.resendVerificationEmail('test@example.com')).rejects.toThrow('User not found');
    });

    it('should throw ValidationError for already verified email', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockVerifiedUser);
      await expect(authService.resendVerificationEmail('test@example.com')).rejects.toThrow('Email already verified');
    });
  });

  describe('createAdmin', () => {
    it('should create admin user', async () => {
      const adminUser = { ...mockUser, role: 'ADMIN' };
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.user.create).mockResolvedValueOnce(adminUser);

      const result = await authService.createAdmin('admin@test.com', 'adminpass123');
      expect(result.role).toBe('ADMIN');
    });
  });

  describe('forgotPassword', () => {
    it('should set password reset token', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser);
      vi.mocked(prisma.user.update).mockResolvedValueOnce(mockUser);

      await authService.forgotPassword('test@example.com');
      expect(prisma.user.update).toHaveBeenCalled();
    });

    it('should not throw when user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
      await expect(authService.forgotPassword('nonexistent@test.com')).resolves.not.toThrow();
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(mockUser);
      vi.mocked(prisma.user.update).mockResolvedValueOnce(mockUser);

      await authService.resetPassword('valid-token', 'newpassword123');
      expect(prisma.user.update).toHaveBeenCalled();
    });

    it('should throw ValidationError for invalid token', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(null);
      await expect(authService.resetPassword('invalid-token', 'newpassword123')).rejects.toThrow('Токен недействителен');
    });
  });
});