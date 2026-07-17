import nodemailer from 'nodemailer';
import { User } from '../generated/prisma/client.js';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}


function renderLayout(params: {
  eyebrow: string;
  title: string;
  bodyHtml: string;
  actionLabel?: string;
  actionUrl?: string;
}): string {
  const { eyebrow, title, bodyHtml, actionLabel, actionUrl } = params;
  const issuedAt = new Date().toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
</head>
<body style="margin:0; padding:0; background-color:#EFECE4; font-family:Georgia, 'Times New Roman', serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#EFECE4; padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#FDFCFA; max-width:560px; width:100%;">

          <!-- Служебная строка -->
          <tr>
            <td style="padding:24px 40px 0 40px; font-family:'Courier New', Courier, monospace; font-size:11px; letter-spacing:0.06em; color:#7A7469; text-transform:uppercase;">
              ${eyebrow} · ${issuedAt}
            </td>
          </tr>

          <!-- Разделитель -->
          <tr>
            <td style="padding:12px 40px 0 40px;">
              <div style="border-top:1px solid #DBD5C8;"></div>
            </td>
          </tr>

          <!-- Заголовок -->
          <tr>
            <td style="padding:28px 40px 0 40px;">
              <h1 style="margin:0; font-family:Georgia, 'Times New Roman', serif; font-size:24px; font-weight:normal; color:#1E1B16; line-height:1.3;">
                ${title}
              </h1>
            </td>
          </tr>

          <!-- Тело письма -->
          <tr>
            <td style="padding:18px 40px 0 40px; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.6; color:#3A362E;">
              ${bodyHtml}
            </td>
          </tr>

          ${
            actionLabel && actionUrl
              ? `
          <!-- Действие -->
          <tr>
            <td style="padding:28px 40px 0 40px;">
              <a href="${actionUrl}" style="display:inline-block; padding:12px 24px; background-color:#1E1B16; color:#FDFCFA; text-decoration:none; font-family:Arial, Helvetica, sans-serif; font-size:14px; letter-spacing:0.02em;">
                ${actionLabel} →
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 40px 0 40px; font-family:Arial, Helvetica, sans-serif; font-size:12px; color:#8B8578; word-break:break-all;">
              Если кнопка не работает, перейдите по ссылке: ${actionUrl}
            </td>
          </tr>`
              : ''
          }

          <!-- Разделитель -->
          <tr>
            <td style="padding:32px 40px 0 40px;">
              <div style="border-top:1px solid #DBD5C8;"></div>
            </td>
          </tr>

          <!-- Подвал -->
          <tr>
            <td style="padding:16px 40px 32px 40px; font-family:'Courier New', Courier, monospace; font-size:11px; color:#A39D8E;">
              Сервис «Практика» — автоматическое уведомление, отвечать на него не нужно.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
      console.log(`Письмо отправлено: ${options.to}`);
    } catch (error) {
      console.error('Не удалось отправить письмо:', error);
      throw new Error('Failed to send email');
    }
  }

  createVerificationEmail(user: User, token: string): EmailOptions {
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const bodyHtml = `
      <p style="margin:0 0 14px 0;">Аккаунт зарегистрирован на адрес <strong>${user.email}</strong>.</p>
      <p style="margin:0;">Подтвердите его, чтобы получить доступ к подаче заявки. Ссылка действует 24 часа.</p>
    `;

    return {
      to: user.email,
      subject: 'Подтверждение почты — Практика',
      html: renderLayout({
        eyebrow: 'Подтверждение адреса',
        title: 'Подтвердите почту',
        bodyHtml,
        actionLabel: 'Подтвердить почту',
        actionUrl: verificationLink,
      }),
      text: `Аккаунт зарегистрирован на адрес ${user.email}.\nПодтвердите его по ссылке (действует 24 часа):\n${verificationLink}`,
    };
  }

  createWelcomeEmail(user: User): EmailOptions {
    const dashboardLink = `${process.env.FRONTEND_URL}/dashboard`;

    const bodyHtml = `
      <p style="margin:0 0 14px 0;">Почта <strong>${user.email}</strong> подтверждена, доступ к личному кабинету открыт.</p>
      <p style="margin:0;">Там можно подать заявку на практику, следить за её статусом и работать с документами.</p>
    `;

    return {
      to: user.email,
      subject: 'Доступ открыт — Практика',
      html: renderLayout({
        eyebrow: 'Регистрация завершена',
        title: 'Личный кабинет готов',
        bodyHtml,
        actionLabel: 'Открыть кабинет',
        actionUrl: dashboardLink,
      }),
      text: `Почта ${user.email} подтверждена, доступ к личному кабинету открыт.\nПерейти: ${dashboardLink}`,
    };
  }

  createPasswordResetEmail(user: User, token: string): EmailOptions {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const bodyHtml = `
      <p style="margin:0 0 14px 0;">Поступил запрос на смену пароля для аккаунта <strong>${user.email}</strong>.</p>
      <p style="margin:0;">Ссылка ниже действует 1 час. Если вы не запрашивали смену пароля — просто игнорируйте это письмо, аккаунт останется без изменений.</p>
    `;

    return {
      to: user.email,
      subject: 'Смена пароля — Практика',
      html: renderLayout({
        eyebrow: 'Запрос на смену пароля',
        title: 'Установите новый пароль',
        bodyHtml,
        actionLabel: 'Задать новый пароль',
        actionUrl: resetLink,
      }),
      text: `Поступил запрос на смену пароля для аккаунта ${user.email}.\nСсылка действует 1 час:\n${resetLink}\nЕсли вы не запрашивали смену пароля — проигнорируйте это письмо.`,
    };
  }

  createTestTaskPublishedEmail(user: User): EmailOptions {
    const dashboardLink = `${process.env.FRONTEND_URL}/dashboard`;

    const bodyHtml = `
      <p style="margin:0 0 14px 0;">Для когорты, в которую вы подали заявку, опубликовано тестовое задание.</p>
      <p style="margin:0;">Перейдите в личный кабинет, чтобы ознакомиться с ним.</p>
    `;

    return {
      to: user.email,
      subject: 'Опубликовано тестовое задание — Практика',
      html: renderLayout({
        eyebrow: 'Тестовое задание',
        title: 'Опубликовано тестовое задание',
        bodyHtml,
        actionLabel: 'Перейти в кабинет',
        actionUrl: dashboardLink,
      }),
      text: `Для когорты, в которую вы подали заявку, опубликовано тестовое задание.\nПерейдите в личный кабинет: ${dashboardLink}`,
    };
  }

  createApplicationApprovedEmail(user: User): EmailOptions {
    const dashboardLink = `${process.env.FRONTEND_URL}/dashboard`;

    const bodyHtml = `
      <p style="margin:0 0 14px 0;">Ваша заявка на практику одобрена.</p>
      <p style="margin:0;">В личном кабинете вам доступны документы и задачи.</p>
    `;

    return {
      to: user.email,
      subject: 'Заявка одобрена — Практика',
      html: renderLayout({
        eyebrow: 'Заявка одобрена',
        title: 'Заявка на практику одобрена',
        bodyHtml,
        actionLabel: 'Открыть кабинет',
        actionUrl: dashboardLink,
      }),
      text: `Ваша заявка на практику одобрена.\nВ личном кабинете вам доступны документы и задачи: ${dashboardLink}`,
    };
  }

  createApplicationRejectedEmail(user: User, reviewComment?: string): EmailOptions {
    const dashboardLink = `${process.env.FRONTEND_URL}/dashboard`;

    const bodyHtml = `
      <p style="margin:0 0 14px 0;">Ваша заявка на практику отклонена.</p>
      ${reviewComment ? `<p style="margin:0;">Комментарий: ${reviewComment}</p>` : ''}
    `;

    return {
      to: user.email,
      subject: 'Заявка отклонена — Практика',
      html: renderLayout({
        eyebrow: 'Заявка отклонена',
        title: 'Заявка на практику отклонена',
        bodyHtml,
        actionLabel: 'Открыть кабинет',
        actionUrl: dashboardLink,
      }),
      text: `Ваша заявка на практику отклонена.${reviewComment ? `\nКомментарий: ${reviewComment}` : ''}\nПерейти: ${dashboardLink}`,
    };
  }

  createDocumentReadyEmail(user: User, documentType: string): EmailOptions {
    const dashboardLink = `${process.env.FRONTEND_URL}/dashboard`;

    const documentLabels: Record<string, string> = {
      'individual-task': 'Индивидуальное задание',
      'title-page': 'Титульный лист',
      'review': 'Отзыв',
      'report': 'Отчёт',
    };

    const label = documentLabels[documentType] || documentType;

    const bodyHtml = `
      <p style="margin:0 0 14px 0;">Документ <strong>${label}</strong> готов к скачиванию.</p>
      <p style="margin:0;">Вы можете скачать его в личном кабинете.</p>
    `;

    return {
      to: user.email,
      subject: `${label} готов — Практика`,
      html: renderLayout({
        eyebrow: 'Документ готов',
        title: label,
        bodyHtml,
        actionLabel: 'Перейти в кабинет',
        actionUrl: dashboardLink,
      }),
      text: `Документ "${label}" готов к скачиванию.\nПерейти: ${dashboardLink}`,
    };
  }

  createDocumentRejectedEmail(user: User, documentType: string, comment: string): EmailOptions {
    const dashboardLink = `${process.env.FRONTEND_URL}/dashboard`;

    const documentLabels: Record<string, string> = {
      'individual-task': 'Индивидуальное задание',
      'title-page': 'Титульный лист',
      'review': 'Отзыв',
      'report': 'Отчёт',
    };

    const label = documentLabels[documentType] || documentType;

    const bodyHtml = `
      <p style="margin:0 0 14px 0;">Документ <strong>${label}</strong> отклонён.</p>
      <p style="margin:0 0 14px 0;">Комментарий администратора: ${comment}</p>
      <p style="margin:0;">Пожалуйста, исправьте замечания и отправьте документ повторно.</p>
    `;

    return {
      to: user.email,
      subject: `${label} отклонён — Практика`,
      html: renderLayout({
        eyebrow: 'Документ отклонён',
        title: label,
        bodyHtml,
        actionLabel: 'Перейти в кабинет',
        actionUrl: dashboardLink,
      }),
      text: `Документ "${label}" отклонён.\nКомментарий: ${comment}\nПерейти: ${dashboardLink}`,
    };
  }

  createDocumentSubmittedEmail(user: User, documentType: string): EmailOptions {
    const dashboardLink = `${process.env.FRONTEND_URL}/admin/dashboard`;

    const documentLabels: Record<string, string> = {
      'individual-task': 'Индивидуальное задание',
      'title-page': 'Титульный лист',
      'review': 'Отзыв',
      'report': 'Отчёт',
    };

    const label = documentLabels[documentType] || documentType;

    const bodyHtml = `
      <p style="margin:0 0 14px 0;">Студент <strong>${user.email}</strong> отправил документ <strong>${label}</strong> на проверку.</p>
      <p style="margin:0;">Перейдите в панель администратора для проверки.</p>
    `;

    return {
      to: user.email,
      subject: `${label} отправлен на проверку — Практика`,
      html: renderLayout({
        eyebrow: 'Документ на проверке',
        title: `${label} отправлен на проверку`,
        bodyHtml,
        actionLabel: 'Перейти в панель',
        actionUrl: dashboardLink,
      }),
      text: `Студент отправил документ "${label}" на проверку.\nПерейти: ${dashboardLink}`,
    };
  }
}

export const mailService = new MailService();
