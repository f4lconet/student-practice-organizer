import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { userRepository } from '../repositories/user.repository.js';
import { mailService } from '../lib/mail.service.js';
import { ConflictError, ValidationError, AuthenticationError, NotFoundError } from '../errors/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const SALT_ROUNDS = 10;

export const authService = {
  async register(email: string, password: string) {
    const normEmail = email.toLowerCase().trim();

    if (!normEmail) {
      throw new ValidationError('Email is required');
    }

    if (!password || password.length < 8) {
      throw new ValidationError('Minimum password length is 8');
    }

    const existingUser = await userRepository.findByEmail(normEmail);
    if (existingUser) {
      throw new ConflictError('User already exists');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await userRepository.create(normEmail, passwordHash);

    const verificationToken = this.generateVerificationToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await userRepository.updateVerificationToken(
      user.id,
      verificationToken,
      expiresAt
    );

    try {
      const emailOptions = mailService.createVerificationEmail(user, verificationToken);
      await mailService.sendEmail(emailOptions);
    } catch (error) {
      console.error('Failed to send verification email:', error);
    }

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      token,
      message: 'Registration successful. Please check your email to verify your account.',
    };
  },

  async login(email: string, password: string) {
    const normEmail = email.toLowerCase().trim();

    if (!normEmail || !password) {
      throw new ValidationError('Email and password is required');
    }

    const user = await userRepository.findByEmail(normEmail);
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new AuthenticationError('Incorrect password');
    }

    if (!user.isEmailVerified) {
      throw new AuthenticationError('Please verify your email before logging in');
    }

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      token,
    };
  },

  generateToken(userId: string, email: string, role: string): string {
    return jwt.sign(
      { id: userId, email, role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
    );
  },

  verifyToken(token: string): { id: string; email: string; role: string } {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: string;
        email: string;
        role: string;
      };
      return decoded;
    } catch (error) {
      throw new AuthenticationError('Invalid or expired token');
    }
  },

  async getUserProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      verifiedAt: user.verifiedAt,
      createdAt: user.createdAt,
    };
  },

  async verifyEmail(token: string) {
    if (!token) {
      throw new ValidationError('Verification token is required');
    }

    const user = await userRepository.findByVerificationToken(token);
    if (!user) {
      throw new ValidationError('Invalid or expired verification token');
    }

    const verifiedUser = await userRepository.verifyEmail(user.id);

    try {
      const welcomeEmail = mailService.createWelcomeEmail(verifiedUser);
      await mailService.sendEmail(welcomeEmail);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }

    return {
      id: verifiedUser.id,
      email: verifiedUser.email,
      isEmailVerified: true,
      verifiedAt: verifiedUser.verifiedAt,
    };
  },

  async resendVerificationEmail(email: string) {
    const normEmail = email.toLowerCase().trim();
    const user = await userRepository.findByEmail(normEmail);

    if (!user) {
      throw new ValidationError('User not found');
    }

    if (user.isEmailVerified) {
      throw new ValidationError('Email already verified');
    }

    const verificationToken = this.generateVerificationToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await userRepository.updateVerificationToken(
      user.id,
      verificationToken,
      expiresAt
    );

    const emailOptions = mailService.createVerificationEmail(user, verificationToken);
    await mailService.sendEmail(emailOptions);

    return {
      message: 'Verification email has been resent',
    };
  },

  async createAdmin(email: string, password: string) {
    const normEmail = email.toLowerCase().trim();

    if (!normEmail) {
      throw new ValidationError('Email is required');
    }

    if (!password || password.length < 8) {
      throw new ValidationError('Minimum password length is 8');
    }

    const existingUser = await userRepository.findByEmail(normEmail);
    if (existingUser) {
      throw new ConflictError('User already exists');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await userRepository.createAdmin(normEmail, passwordHash);

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  },

  async updateUserRole(userId: string, role: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (role !== 'ADMIN' && role !== 'PRACTICANT') {
      throw new ValidationError('Invalid role');
    }

    return userRepository.updateRole(userId, role);
  },

  async forgotPassword(email: string): Promise<void> {
    const user = await userRepository.findByEmail(email.toLowerCase());

    if (!user) return;

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 час

    await userRepository.setPasswordResetToken(user.id, token, expiresAt);

    const email_ = mailService.createPasswordResetEmail(user, token);
    await mailService.sendEmail(email_);
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await userRepository.findByPasswordResetToken(token);

    if (!user) {
      throw new ValidationError('Токен недействителен или срок его действия истёк');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await userRepository.resetPassword(user.id, passwordHash);
  },

  generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  },
};