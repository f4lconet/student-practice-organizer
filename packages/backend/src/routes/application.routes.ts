import { Router } from 'express';
import { applicationController } from '../controllers/application.controller.js';
import { testTaskController } from '../controllers/testTask.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /applications:
 *   post:
 *     summary: Подать заявку на практику
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cohortId
 *               - roleId
 *               - answers
 *             properties:
 *               cohortId:
 *                 type: string
 *                 description: ID когорты, на которую подаётся заявка
 *                 example: "clxxyz123"
 *               roleId:
 *                 type: string
 *                 description: ID выбранной роли/трека
 *                 example: "clxxyz456"
 *               answers:
 *                 type: array
 *                 description: |
 *                   Ответы на поля анкеты. Массив объектов, где fieldId — ID поля
 *                   из GET /public/cohorts/{id}/survey, value — введённое значение.
 *                 items:
 *                   type: object
 *                   required:
 *                     - fieldId
 *                     - value
 *                   properties:
 *                     fieldId:
 *                       type: string
 *                       description: ID поля анкеты
 *                       example: "clxxyz789"
 *                     value:
 *                       type: string
 *                       description: Значение ответа
 *                       example: "Иванов Иван Иванович"
 *     responses:
 *       201:
 *         description: Заявка создана
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "clxxyz-app1"
 *                 userId:
 *                   type: string
 *                   example: "clxxyz-user1"
 *                 cohortId:
 *                   type: string
 *                   example: "clxxyz-cohort1"
 *                 roleId:
 *                   type: string
 *                   example: "clxxyz-role1"
 *                 status:
 *                   type: string
 *                   example: "pending"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 fieldValues:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       fieldId:
 *                         type: string
 *                       value:
 *                         type: string
 *       400:
 *         description: Ошибка валидации (не указана роль, не заполнены обязательные поля анкеты и т.п.)
 *       409:
 *         description: Заявка в эту когорту уже подана
 *       404:
 *         description: Когорта или роль не найдены
 */
router.post('/', applicationController.submit);

/**
 * @swagger
 * /applications/my:
 *   get:
 *     summary: Получить свои заявки
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список заявок текущего пользователя
 */
router.get('/my', applicationController.getMyApplications);

/**
 * @swagger
 * /applications/prefill:
 *   get:
 *     summary: Получить данные для предзаполнения из последней заявки
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 'Объект { label: value } из последней заявки'
 */
router.get('/prefill', applicationController.getPrefill);

/**
 * @swagger
 * /applications/{id}/test-task:
 *   get:
 *     summary: Получить тестовое задание для заявки
 *     description: |
 *       Доступно только автору заявки. Возвращает содержимое тестового задания,
 *       если оно опубликовано. Если задание ещё не опубликовано — возвращает
 *       { published: false }.
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Результат
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     published:
 *                       type: boolean
 *                       example: true
 *                     content:
 *                       type: string
 *                 - type: object
 *                   properties:
 *                     published:
 *                       type: boolean
 *                       example: false
 *       403:
 *         description: Доступ запрещён
 *       404:
 *         description: Заявка не найдена
 */
router.get('/:id/test-task', testTaskController.getForApplication);

export default router;