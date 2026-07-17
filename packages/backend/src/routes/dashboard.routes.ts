import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Получить данные личного кабинета
 *     description: |
 *       Возвращает список заявок пользователя и признак доступности вкладки
 *       "Задачи" (есть одобренная заявка в активной когорте).
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Данные личного кабинета
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 applications:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Application'
 *                 tasksTabAvailable:
 *                   type: boolean
 */
router.get('/', dashboardController.getMyDashboard);

export default router;