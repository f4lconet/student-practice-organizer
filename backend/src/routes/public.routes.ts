import { Router } from 'express';
import { cohortController } from '../controllers/cohort.controller.js';
import { surveyController } from '../controllers/survey.controller.js';

const router = Router();

/**
 * @swagger
 * /public/cohorts/active:
 *   get:
 *     summary: Получить активную когорту
 *     description: |
 *       Возвращает когорту, для которой сейчас идёт приём заявок
 *       (текущая дата попадает в диапазон applicationStart–applicationEnd).
 *       Эндпоинт публичный — авторизация не требуется, используется для
 *       отображения анкеты неавторизованному кандидату.
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Активная когорта найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cohort'
 *       404:
 *         description: Сейчас нет когорты с открытым приёмом заявок
 */
router.get('/cohorts/active', cohortController.findActive);

/**
 * @swagger
 * /public/cohorts/{id}/survey:
 *   get:
 *     summary: Получить поля анкеты для когорты
 *     description: |
 *       Возвращает список полей анкеты для указанной когорты.
 *       Эндпоинт публичный — авторизация не требуется.
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Список полей анкеты
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SurveyField'
 *       404:
 *         description: Когорта не найдена
 */
router.get('/cohorts/:id/survey', surveyController.findByCohort);

export default router;
