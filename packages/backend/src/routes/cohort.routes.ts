import { Router } from 'express';
import { cohortController } from '../controllers/cohort.controller.js';
import { cohortRoleController } from '../controllers/cohortRole.controller.js';
import { testTaskController } from '../controllers/testTask.controller.js';
import { applicationController } from '../controllers/application.controller.js';
import { documentController } from '../controllers/document.controller.js';
import { adminOverviewController } from '../controllers/adminOverview.controller.js';
import { taskCardController } from '../controllers/taskCard.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/requireRole.js';
import { cohortContextMiddleware } from '../middleware/cohortContext.middleware.js';

const router = Router();

router.use(authMiddleware);
router.use(requireRole(['ADMIN']));

/**
 * @swagger
 * /admin/cohorts:
 *   post:
 *     summary: Создать новую когорту
 *     description: Только для админа. Задаёт сроки приёма заявок и сроки прохождения практики.
 *     tags: [Cohorts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - applicationStart
 *               - applicationEnd
 *               - practiceStart
 *               - practiceEnd
 *             properties:
 *               name:
 *                 type: string
 *                 example: "2026"
 *               applicationStart:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-01-01T00:00:00.000Z"
 *               applicationEnd:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-03-01T00:00:00.000Z"
 *               practiceStart:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-06-01T00:00:00.000Z"
 *               practiceEnd:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-08-31T00:00:00.000Z"
 *     responses:
 *       201:
 *         description: Когорта создана
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cohort'
 *       400:
 *         description: Ошибка валидации (например, даты заданы некорректно)
 *       409:
 *         description: Когорта с таким названием уже существует
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Требуется роль администратора
 */
router.post('/', cohortController.create);

/**
 * @swagger
 * /admin/cohorts:
 *   get:
 *     summary: Получить список всех когорт
 *     tags: [Cohorts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список когорт
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Cohort'
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Требуется роль администратора
 */
router.get('/', cohortController.findAll);

/**
 * @swagger
 * /admin/cohorts/{id}:
 *   get:
 *     summary: Получить когорту по ID
 *     tags: [Cohorts]
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
 *         description: Когорта найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cohort'
 *       404:
 *         description: Когорта не найдена
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Требуется роль администратора
 */
router.get('/:id', cohortController.findById);

/**
 * @swagger
 * /admin/cohorts/{id}:
 *   put:
 *     summary: Обновить когорту
 *     description: Позволяет изменить название и/или сроки. Все поля необязательны — обновляются только переданные.
 *     tags: [Cohorts]
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
 *             properties:
 *               name:
 *                 type: string
 *               applicationStart:
 *                 type: string
 *                 format: date-time
 *               applicationEnd:
 *                 type: string
 *                 format: date-time
 *               practiceStart:
 *                 type: string
 *                 format: date-time
 *               practiceEnd:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Когорта обновлена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cohort'
 *       400:
 *         description: Ошибка валидации
 *       404:
 *         description: Когорта не найдена
 *       409:
 *         description: Когорта с таким названием уже существует
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Требуется роль администратора
 */
router.put('/:id', cohortController.update);

/**
 * @swagger
 * /admin/cohorts/{id}:
 *   delete:
 *     summary: Удалить когорту
 *     description: |
 *       Осторожно: если у когорты уже есть заявки, документы или задачи практикантов,
 *       убедитесь, что на уровне сервиса это обрабатывается безопасно
 *       (запрет удаления при наличии связанных данных либо архивирование вместо
 *       физического удаления).
 *     tags: [Cohorts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Когорта удалена
 *       404:
 *         description: Когорта не найдена
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Требуется роль администратора
 */
router.delete('/:id', cohortController.delete);

/**
 * @swagger
 * /admin/cohorts/{cohortId}/roles:
 *   post:
 *     summary: Добавить роль/трек в когорту
 *     description: Например, "Frontend", "Backend", "Аналитик" — произвольный текст, задаётся заново под каждую когорту.
 *     tags: [Cohort Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
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
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Frontend"
 *     responses:
 *       201:
 *         description: Роль создана
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CohortRole'
 *       400:
 *         description: Ошибка валидации
 *       404:
 *         description: Когорта не найдена
 *       409:
 *         description: Такая роль уже есть в этой когорте
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Требуется роль администратора
 */
router.post('/:cohortId/roles', cohortContextMiddleware, cohortRoleController.create);

/**
 * @swagger
 * /admin/cohorts/{cohortId}/roles:
 *   get:
 *     summary: Получить список ролей когорты
 *     tags: [Cohort Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cohortId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Список ролей
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CohortRole'
 *       404:
 *         description: Когорта не найдена
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Требуется роль администратора
 */
router.get('/:cohortId/roles', cohortContextMiddleware, cohortRoleController.findByCohort);

/**
 * @swagger
 * /admin/cohorts/roles/{id}:
 *   delete:
 *     summary: Удалить роль
 *     description: |
 *       Если роль уже назначена практикантам (Application.roleId), проверьте
 *       на уровне сервиса, что удаление не оставляет заявки со ссылкой
 *       на несуществующую роль.
 *     tags: [Cohort Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Роль удалена
 *       404:
 *         description: Роль не найдена
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Требуется роль администратора
 */
router.delete('/roles/:id', cohortContextMiddleware, cohortRoleController.delete);

/**
 * @swagger
 * /admin/cohorts/{cohortId}/test-task:
 *   post:
 *     summary: Создать или обновить тестовое задание для когорты
 *     tags: [Admin / Test Task]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
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
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Тестовое задание сохранено
 */
router.post('/:cohortId/test-task', cohortContextMiddleware, testTaskController.upsert);

/**
 * @swagger
 * /admin/cohorts/{cohortId}/test-task/publish:
 *   patch:
 *     summary: Опубликовать тестовое задание
 *     tags: [Admin / Test Task]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cohortId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Тестовое задание опубликовано, уведомления отправлены
 */
router.patch('/:cohortId/test-task/publish', cohortContextMiddleware, testTaskController.publish);

/**
 * @swagger
 * /admin/cohorts/{cohortId}/applications:
 *   get:
 *     summary: Получить заявки когорты
 *     tags: [Admin / Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cohortId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Список заявок когорты
 */
router.get('/:cohortId/applications', cohortContextMiddleware, applicationController.findAllByCohort);

/**
 * @swagger
 * /admin/applications/{id}/approve:
 *   patch:
 *     summary: Одобрить заявку
 *     tags: [Admin / Applications]
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
 *             required: [roleId]
 *             properties:
 *               roleId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Заявка одобрена
 */
router.patch('/applications/:id/approve', applicationController.approve);

/**
 * @swagger
 * /admin/applications/{id}/reject:
 *   patch:
 *     summary: Отклонить заявку
 *     tags: [Admin / Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reviewComment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Заявка отклонена
 */
router.patch('/applications/:id/reject', applicationController.reject);

/**
 * @swagger
 * /admin/documents/{userId}/{cohortId}/review:
 *   patch:
 *     summary: Заполнить отзыв руководителя практики (админ)
 *     description: |
 *       Администратор заполняет отзыв на практиканта.
 *       Все поля опциональны — обновляются только переданные.
 *       Когда заполнены все поля отзыва, практиканту автоматически
 *       приходит уведомление о готовности документа.
 *     tags: [Admin / Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID практиканта
 *       - in: path
 *         name: cohortId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID когорты
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reviewActivities:
 *                 type: string
 *                 description: Виды деятельности, выполненные практикантом
 *                 example: "Разработка REST API, написание тестов, рефакторинг"
 *               reviewCharacteristic:
 *                 type: string
 *                 description: Характеристика практиканта
 *                 example: "Проявил себя как ответственный исполнитель"
 *               reviewEmployed:
 *                 type: string
 *                 description: Трудоустройство (планируется / не планируется)
 *                 example: "Рекомендован к трудоустройству"
 *               reviewNextPractice:
 *                 type: string
 *                 description: Рекомендации на следующую практику
 *                 example: "Рекомендуется углублённое изучение DevOps"
 *               reviewEmploymentOffer:
 *                 type: string
 *                 description: Предложение о работе
 *                 example: "Предложена позиция Junior Developer"
 *               reviewSuggestions:
 *                 type: string
 *                 description: Замечания и предложения
 *                 example: "Уделить внимание архитектуре микросервисов"
 *               reviewGrade:
 *                 type: string
 *                 description: Оценка за практику
 *                 example: "Отлично"
 *     responses:
 *       200:
 *         description: Отзыв сохранён
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 reviewActivities:
 *                   type: string
 *                 reviewCharacteristic:
 *                   type: string
 *                 reviewEmployed:
 *                   type: string
 *                 reviewNextPractice:
 *                   type: string
 *                 reviewEmploymentOffer:
 *                   type: string
 *                 reviewSuggestions:
 *                   type: string
 *                 reviewGrade:
 *                   type: string
 *       400:
 *         description: Ошибка валидации
 *       404:
 *         description: Документ не найден
 */
router.patch('/documents/:userId/:cohortId/review', documentController.setReview);

/**
 * @swagger
 * /admin/cohorts/{cohortId}/documents-overview:
 *   get:
 *     summary: Получить сводку по документам практикантов когорты
 *     tags: [Admin / Overview]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cohortId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Сводка по документам
 *       404:
 *         description: Когорта не найдена
 */
router.get('/:cohortId/documents-overview', cohortContextMiddleware, adminOverviewController.getDocumentsOverview);

/**
 * @swagger
 * /admin/cohorts/{cohortId}/tasks-overview:
 *   get:
 *     summary: Получить сводку по задачам практикантов когорты
 *     tags: [Admin / Overview]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cohortId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Сводка по задачам
 *       404:
 *         description: Когорта не найдена
 */
router.get('/:cohortId/tasks-overview', cohortContextMiddleware, adminOverviewController.getTasksOverview);

/**
 * @swagger
 * /admin/cohorts/{cohortId}/tasks-grid:
 *   get:
 *     summary: Получить сетку задач всех студентов (админ)
 *     description: |
 *       Возвращает задачи всех студентов когорты на указанную неделю,
 *       сгруппированные по участникам с их ФИО.
 *     tags: [Admin / Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cohortId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: weekStart
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-06-01"
 *     responses:
 *       200:
 *         description: Сетка задач всех студентов
 *       404:
 *         description: Когорта не найдена
 */
router.get('/:cohortId/tasks-grid', cohortContextMiddleware, taskCardController.getTasksGrid);

/**
 * @swagger
 * /admin/cohorts/{cohortId}/participants:
 *   get:
 *     summary: Получить список участников когорты (админ)
 *     description: Возвращает список практикантов с их ФИО и группой.
 *     tags: [Admin / Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cohortId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Список участников
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   userId:
 *                     type: string
 *                   userName:
 *                     type: string
 *                   group:
 *                     type: string
 *       404:
 *         description: Когорта не найдена
 */
router.get('/:cohortId/participants', cohortContextMiddleware, taskCardController.getParticipants);

export default router;
