import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { AuthenticationError, ValidationError } from '../errors/index.js';

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.register(email, password);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AuthenticationError('User not authenticated');
      }
      const user = await authService.getUserProfile(req.user.id);
      res.json(user);
    } catch (error) {
      next(error);
    }
  },

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.query;
      const result = await authService.verifyEmail(token as string);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async resendVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const result = await authService.resendVerificationEmail(email);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async createAdmin(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.createAdmin(email, password);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  async updateUserRole(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const id = Array.isArray(userId) ? userId[0] : userId;
      const { role } = req.body;
      const result = await authService.updateUserRole(id, role);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      if (!email) {
        throw new ValidationError('Email обязателен');
      }

      await authService.forgotPassword(email);

      res.json({ message: 'Если такой email зарегистрирован, письмо со ссылкой отправлено' });
    } catch (err) {
      next(err);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        throw new ValidationError('Токен и новый пароль обязательны');
      }
      if (typeof password !== 'string' || password.length < 8) {
        throw new ValidationError('Пароль должен быть не короче 8 символов');
      }

      await authService.resetPassword(token, password);

      res.json({ message: 'Пароль успешно изменён' });
    } catch (err) {
      next(err);
    }
  },
};