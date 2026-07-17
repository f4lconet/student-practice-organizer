import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Регистрация нового пользователя
 *     description: |
 *       Создаёт учётную запись по email и паролю. Пароль хешируется через bcrypt
 *       перед сохранением. После регистрации на почту отправляется письмо
 *       со ссылкой для подтверждения адреса.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: strongpassword123
 *               firstName:
 *                 type: string
 *                 example: Иван
 *               lastName:
 *                 type: string
 *                 example: Иванов
 *               role:
 *                 type: string
 *                 enum: [PRACTICANT, ADMIN]
 *                 description: Роль пользователя. `PRACTICANT` — практикант (студент), `ADMIN` — администратор.
 *                 example: PRACTICANT
 *     responses:
 *       201:
 *         description: Пользователь успешно зарегистрирован
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "clxxyz123"
 *                 email:
 *                   type: string
 *                   example: user@example.com
 *                 role:
 *                   type: string
 *                   example: "PRACTICANT"
 *                 token:
 *                   type: string
 *                   description: "JWT для авторизации (передавать в заголовок Authorization: Bearer <token>)"
 *                   example: "eyJhbGciOiJIUzI1NiIs..."
 *                 message:
 *                   type: string
 *                   example: "Registration successful. Please check your email to verify your account."
 *               required:
 *                 - id
 *                 - email
 *                 - role
 *                 - token
 *                 - message
 *       400:
 *         description: Ошибка валидации входных данных
 *       409:
 *         description: Пользователь с таким email уже существует
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Вход в систему
 *     description: Проверяет email и пароль, возвращает JWT для дальнейших запросов.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: strongpassword123
 *     responses:
 *       200:
 *         description: Вход выполнен успешно
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - user
 *                 - token
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "clxxyz123"
 *                     email:
 *                       type: string
 *                       example: user@example.com
 *                     role:
 *                       type: string
 *                       enum: [PRACTICANT, ADMIN]
 *                       example: "PRACTICANT"
 *                     isEmailVerified:
 *                       type: boolean
 *                       example: true
 *                 token:
 *                   type: string
 *                   description: "JWT. Передавать в заголовок Authorization: Bearer <token> для всех защищённых эндпоинтов."
 *                   example: "eyJhbGciOiJIUzI1NiIs..."
 *       401:
 *         description: Неверный email/пароль или почта не подтверждена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Неверный email или пароль"
 *                     code:
 *                       type: string
 *                       example: "UNAUTHORIZED"
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /auth/verify-email:
 *   get:
 *     summary: Подтверждение почты
 *     description: |
 *       Принимает токен из ссылки, отправленной на почту при регистрации.
 *       Токен одноразовый и действует ограниченное время (см. реализацию сервиса).
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Токен подтверждения из письма
 *     responses:
 *       200:
 *         description: Почта успешно подтверждена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 isEmailVerified:
 *                   type: boolean
 *                 verifiedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Токен недействителен или срок его действия истёк
 */
router.get('/verify-email', authController.verifyEmail);

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     summary: Повторная отправка письма для подтверждения почты
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Письмо отправлено повторно
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Пользователь не найден или почта уже подтверждена
 */
router.post('/resend-verification', authController.resendVerification);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Запрос на смену пароля
 *     description: Отправляет на почту ссылку для сброса пароля. Токен действует 1 час.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Письмо со ссылкой на сброс пароля отправлено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Пользователь с таким email не найден
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Установка нового пароля по токену сброса
 *     description: |
 *       Завершает сценарий "забыли пароль": принимает токен из письма
 *       и новый пароль, сохраняет его хеш. Токен становится недействителен
 *       сразу после успешного использования.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 description: Токен из ссылки в письме
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: newStrongPassword123
 *     responses:
 *       200:
 *         description: Пароль успешно изменён
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Токен недействителен, истёк или уже использован
 */
router.post('/reset-password', authController.resetPassword);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Получить профиль текущего пользователя
 *     description: Требует авторизации — данные берутся из токена в заголовке Authorization.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Профиль пользователя
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 role:
 *                   type: string
 *                 isEmailVerified:
 *                   type: boolean
 *                 verifiedAt:
 *                   type: string
 *                   format: date-time
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Токен отсутствует или недействителен
 */
router.get('/me', authMiddleware, authController.me);

export default router;