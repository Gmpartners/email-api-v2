const nodemailer = require('nodemailer');
const cheerio = require('cheerio');

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

        this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    }

    // Adiciona pixel de rastreamento e transforma links
    prepareHtmlContent(html, emailId, leadId) {
        const $ = cheerio.load(html);

        // Adicionar pixel de rastreamento
        const trackingPixel = `<img src="${this.baseUrl}/track/open/${emailId}/${leadId}.png" width="1" height="1" />`;
        $('body').append(trackingPixel);

        // Transformar todos os links
        $('a').each((i, elem) => {
            const originalUrl = $(elem).attr('href');
            if (originalUrl && originalUrl.startsWith('http')) {
                const trackingUrl = `${this.baseUrl}/track/click/${emailId}/${leadId}?url=${encodeURIComponent(originalUrl)}`;
                $(elem).attr('href', trackingUrl);
            }
        });

        return $.html();
    }

    async sendEmail(lead, emailContent) {
        try {
            // Preparar HTML com tracking
            const preparedHtml = this.prepareHtmlContent(
                emailContent.htmlContent,
                emailContent.emailId,
                lead._id
            );

            const mailOptions = {
                from: `"${emailContent.fromName}" <${emailContent.fromEmail}>`,
                to: lead.email,
                subject: emailContent.subject,
                html: preparedHtml,
                headers: {
                    'X-Campaign-ID': emailContent.campaignId,
                    'X-Email-ID': emailContent.emailId,
                    'X-Lead-ID': lead._id
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
