import { Router } from 'express';
import { applicationController } from '../controllers/application.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/requireRole.js';

const router = Router();

router.use(authMiddleware);
router.use(requireRole(['ADMIN']));

/**
 * @swagger
 * /admin/applications/{id}/approve:
 *   patch:
 *     summary: Одобрить заявку
 *     tags: [Admin Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleId
 *             properties:
 *               roleId:
 *                 type: string
 *                 description: ID роли, на которую одобряется заявка
 *     responses:
 *       200:
 *         description: Заявка одобрена
 *       404:
 *         description: Заявка не найдена
 *       400:
 *         description: Ошибка валидации
 */
router.patch('/:id/approve', applicationController.approve);

/**
 * @swagger
 * /admin/applications/{id}/reject:
 *   patch:
 *     summary: Отклонить заявку
 *     tags: [Admin Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reviewComment
 *             properties:
 *               reviewComment:
 *                 type: string
 *                 description: Причина отклонения
 *     responses:
 *       200:
 *         description: Заявка отклонена
 *       404:
 *         description: Заявка не найдена
 *       400:
 *         description: Ошибка валидации
 */
router.patch('/:id/reject', applicationController.reject);

export default router;