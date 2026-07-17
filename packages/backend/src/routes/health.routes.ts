import { Router } from 'express';
import prisma from '../db/prisma.js';

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Проверка состояния сервера
 *     description: |
 *       Эндпоинт для проверки работоспособности сервера и подключения к базе данных.
 *       Используется для мониторинга и health-check'ов.
 *
 *       Возвращает:
 *       - Статус сервера (ok/error)
 *       - Время проверки
 *       - Статус подключения к БД
 *       - Детали ошибки (если есть)
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Сервер работает корректно
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [ok]
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2026-01-15T10:30:00.000Z"
 *                 database:
 *                   type: string
 *                   enum: [connected]
 *                   example: connected
 *       500:
 *         description: Ошибка сервера или проблема с подключением к БД
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [error]
 *                   example: error
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2026-01-15T10:30:00.000Z"
 *                 database:
 *                   type: string
 *                   enum: [disconnected]
 *                   example: disconnected
 *                 error:
 *                   type: string
 *                   description: Сообщение об ошибке
 *                   example: "Failed to connect to database"
 */
router.get('/', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;