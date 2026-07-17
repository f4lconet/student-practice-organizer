import { Router } from 'express';
import { adminDocumentController } from '../controllers/adminDocument.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/requireRole.js';

const router = Router();

router.use(authMiddleware);
router.use(requireRole(['ADMIN']));

/**
 * @swagger
 * /admin/documents/{userId}/{cohortId}/{type}/approve:
 *   patch:
 *     summary: Подтвердить документ (админ)
 *     tags: [Admin Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: cohortId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [individual-task, report, title-page, review]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fileUrl:
 *                 type: string
 *                 description: URL подписанного файла
 *               comment:
 *                 type: string
 *                 description: Опциональный комментарий
 *     responses:
 *       200:
 *         description: Документ подтверждён
 */
router.patch('/:userId/:cohortId/:type/approve', adminDocumentController.approveDocument);

/**
 * @swagger
 * /admin/documents/{userId}/{cohortId}/{type}/reject:
 *   patch:
 *     summary: Отклонить документ (админ)
 *     tags: [Admin Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: cohortId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [individual-task, report, title-page, review]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment:
 *                 type: string
 *                 description: Комментарий при отклонении
 *     responses:
 *       200:
 *         description: Документ отклонён
 */
router.patch('/:userId/:cohortId/:type/reject', adminDocumentController.rejectDocument);

/**
 * @swagger
 * /admin/documents/{userId}/{cohortId}/{type}/status:
 *   get:
 *     summary: Получить статус документа (админ)
 *     tags: [Admin Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: cohortId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [individual-task, report, title-page, review]
 *     responses:
 *       200:
 *         description: Статус документа
 */
router.get('/:userId/:cohortId/:type/status', adminDocumentController.getStatus);

export default router;