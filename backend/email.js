const nodemailer = require('nodemailer');
const config = require('../config.js');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: config.email.service,
            host: config.email.host,
            port: config.email.port,
            secure: config.email.secure,
            auth: config.email.auth
        });
    }

    async sendVacancyCreatedNotification(employer, vacancy) {
        const subject = `Вакансия "${vacancy.subject}" успешно создана`;
        const html = `
            <h2>Вакансия успешно создана!</h2>
            <p>Здравствуйте, ${employer.contact_name}!</p>
            <p>Ваша вакансия была успешно опубликована на платформе Temp Teachers.</p>

            <h3>Детали вакансии:</h3>
            <ul>
                <li><strong>Предмет:</strong> ${vacancy.subject}</li>
                <li><strong>Тип работы:</strong> ${vacancy.work_type}</li>
                <li><strong>Период:</strong> ${vacancy.start_date} - ${vacancy.end_date}</li>
                <li><strong>График:</strong> ${vacancy.schedule_from} - ${vacancy.schedule_to}</li>
                <li><strong>Оплата:</strong> ${vacancy.salary_amount} ${vacancy.salary_type}</li>
            </ul>

            <h3>Контактная информация:</h3>
            <ul>
                <li><strong>Телефон:</strong> ${vacancy.contact_phone}</li>
                ${vacancy.contact_email ? `<li><strong>Email:</strong> ${vacancy.contact_email}</li>` : ''}
                ${vacancy.contact_person ? `<li><strong>Контактное лицо:</strong> ${vacancy.contact_person}</li>` : ''}
            </ul>

            <p>Вакансия доступна для просмотра кандидатами. Вы можете управлять статусом вакансии в личном кабинете.</p>

            <p>С уважением,<br>Команда Temp Teachers</p>
        `;

        return this.sendEmail(employer.email, subject, html);
    }

    async sendVacancyClosedNotification(employer, vacancy) {
        const subject = `Вакансия "${vacancy.subject}" закрыта`;
        const html = `
            <h2>Вакансия закрыта</h2>
            <p>Здравствуйте, ${employer.contact_name}!</p>
            <p>Статус вашей вакансии "${vacancy.subject}" был изменен на "Закрыта".</p>

            <h3>Информация о вакансии:</h3>
            <ul>
                <li><strong>Предмет:</strong> ${vacancy.subject}</li>
                <li><strong>Период:</strong> ${vacancy.start_date} - ${vacancy.end_date}</li>
                <li><strong>Дата закрытия:</strong> ${new Date().toLocaleDateString('ru-RU')}</li>
            </ul>

            <p>Если вам нужно создать аналогичную вакансию, вы можете воспользоваться архивом в личном кабинете.</p>

            <p>С уважением,<br>Команда Temp Teachers</p>
        `;

        return this.sendEmail(employer.email, subject, html);
    }

    async sendEmail(to, subject, html) {
        // Check if email is enabled
        if (!config.email.enabled) {
            console.log('Email sending is disabled (set EMAIL_ENABLED=true to enable)');
            return null;
        }

        try {
            const mailOptions = {
                from: config.email.from,
                to: to,
                subject: subject,
                html: html
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('Email sent successfully:', result.messageId);
            return result;
        } catch (error) {
            console.error('Error sending email:', error);
            // Don't throw error to avoid breaking the main flow
            return null;
        }
    }
}

module.exports = new EmailService();
