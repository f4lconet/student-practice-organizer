import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { AppError } from '../errors/index.js';

interface MulterError extends Error {
  code: string;
  field?: string;
}

export const errorHandler = (
  err: Error | AppError | PrismaClientKnownRequestError | MulterError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Кастомные ошибки AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code,
      },
    });
    return;
  }

  // Ошибки Prisma
  if (err instanceof PrismaClientKnownRequestError) {
    const prismaError = handlePrismaError(err);
    res.status(prismaError.statusCode).json({
      error: {
        message: prismaError.message,
        code: prismaError.code,
      },
    });
    return;
  }

  // Ошибки валидации
  if (err.name === 'ValidationError' || err.name === 'ZodError') {
    res.status(400).json({
      error: {
        message: err.message,
        code: 'VALIDATION_ERROR',
      },
    });
    return;
  }

  // Ошибки JWT
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({
      error: {
        message: 'Недействительный токен',
        code: 'INVALID_TOKEN_ERROR',
      },
    });
    return;
  }

  // Ошибка multer
  if (err.name === 'MulterError') {
    const multerErr = err as MulterError;
    const messages: Record<string, string> = {
      LIMIT_FILE_SIZE: 'Файл слишком большой',
      LIMIT_FILE_COUNT: 'Слишком много файлов',
      LIMIT_FIELD_KEY: 'Недопустимое имя поля',
      LIMIT_FIELD_VALUE: 'Недопустимое значение поля',
      LIMIT_FIELD_COUNT: 'Слишком много полей',
      LIMIT_UNEXPECTED_FILE: 'Неожиданный файл',
    };
    res.status(400).json({
      error: {
        message: messages[multerErr.code] || 'Ошибка загрузки файла',
        code: 'UPLOAD_ERROR',
      },
    });
    return;
  }

  // Любая ошибка 500
  res.status(500).json({
    error: {
      message: process.env.NODE_ENV === 'production' 
        ? 'Внутренняя ошибка сервера' 
        : err.message,
      code: 'INTERNAL_SERVER_ERROR',
    },
  });
};

const handlePrismaError = (err: PrismaClientKnownRequestError): {
  statusCode: number;
  message: string;
  code: string;
} => {
  switch (err.code) {
    case 'P2000':
      return { statusCode: 400, message: 'Значение слишком длинное для поля', code: 'PRISMA_VALUE_TOO_LONG' };
    case 'P2001':
      return { statusCode: 404, message: 'Запись не найдена', code: 'PRISMA_RECORD_NOT_FOUND' };
    case 'P2002':
      return { statusCode: 409, message: 'Нарушение уникальности', code: 'PRISMA_UNIQUE_CONSTRAINT' };
    case 'P2003':
      return { statusCode: 400, message: 'Нарушение внешнего ключа', code: 'PRISMA_FOREIGN_KEY_CONSTRAINT' };
    case 'P2025':
      return { statusCode: 404, message: 'Запись не найдена для обновления/удаления', code: 'PRISMA_RECORD_NOT_FOUND' };
    default:
      return { statusCode: 500, message: `Ошибка базы данных: ${err.message}`, code: 'PRISMA_UNKNOWN_ERROR' };
  }
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
};