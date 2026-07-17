import { Router } from 'express';
import multer from 'multer';
import { documentController } from '../controllers/document.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const upload = multer({ dest: 'uploads/' });
const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /documents/my:
 *   get:
 *     summary: Получить или создать документы для заявки
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: cohortId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Данные документов
 */
router.get('/my', documentController.getOrCreate);

/**
 * @swagger
 * /documents/my/all:
 *   get:
 *     summary: Получить статусы всех документов для студента
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cohortId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Статусы всех документов
 */
router.get('/my/all', documentController.getMyDocuments);

/**
 * @swagger
 * /documents/my:
 *   patch:
 *     summary: Обновить поля документов
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cohortId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               studentFio:
 *                 type: string
 *               group:
 *                 type: string
 *               directionCode:
 *                 type: string
 *               directionName:
 *                 type: string
 *               programName:
 *                 type: string
 *               specialty:
 *                 type: string
 *               practiceTopic:
 *                 type: string
 *               mainStageTasks:
 *                 type: string
 *     responses:
 *       200:
 *         description: Данные обновлены
 */
router.patch('/my', documentController.update);

/**
 * @swagger
 * /documents/my/report:
 *   post:
 *     summary: Загрузить отчёт
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cohortId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Отчёт загружен
 */
router.post('/my/report', upload.single('file'), documentController.uploadReport);

/**
 * @swagger
 * /documents/my/{type}/generate:
 *   get:
 *     summary: Сгенерировать документ
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [individual-task, title-page, review]
 *       - in: query
 *         name: cohortId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Сгенерированный .docx файл
 */
router.get('/my/:type/generate', documentController.generate);

/**
 * @swagger
 * /documents/my/{type}/submit:
 *   post:
 *     summary: Отправить документ на проверку
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [individual-task, report, title-page, review]
 *       - in: query
 *         name: cohortId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Документ отправлен на проверку
 */
router.post('/my/:type/submit', upload.single('file'), documentController.submitDocument);

/**
 * @swagger
 * /documents/my/{type}/status:
 *   get:
 *     summary: Получить статус документа
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [individual-task, report, title-page, review]
 *       - in: query
 *         name: cohortId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Статус документа
 */
router.get('/my/:type/status', documentController.getStatus);

export default router;