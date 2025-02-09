const nodemailer = require('nodemailer');
const Email = require('../models/email');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    async sendEmail(lead, emailContent) {
        try {
            const mailOptions = {
                from: `"${emailContent.fromName}" <${emailContent.fromEmail}>`,
                to: lead.email,
                subject: emailContent.subject,
                html: emailContent.htmlContent,
                headers: {
                    'X-Campaign-ID': emailContent.campaignId,
                    'X-Email-ID': emailContent.emailId
                }
            };

            const result = await this.transporter.sendMail(mailOptions);
            
            // Incrementar contagem de envios
            await emailContent.incrementStat('sends');
            
            console.log('Email enviado:', result);
            return result;
        } catch (error) {
            console.error('Erro ao enviar email:', error);
            throw error;
        }
    }

    calculateDelayMilliseconds(delay) {
        const multipliers = {
            seconds: 1000,
            minutes: 60 * 1000,
            hours: 60 * 60 * 1000,
            days: 24 * 60 * 60 * 1000
        };

        return delay.value * multipliers[delay.unit];
    }

    async testConnection() {
        try {
            await this.transporter.verify();
            return true;
        } catch (error) {
            console.error('Erro na conexão SMTP:', error);
            return false;
        }
    }
}

module.exports = new EmailService();
