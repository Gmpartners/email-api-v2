require('dotenv').config();
const mongoose = require('mongoose');
const emailService = require('../services/emailService');
const connectDB = require('../config/mongodb');

async function processEmails() {
    try {
        // Conectar ao MongoDB
        await connectDB();

        // Testar conexão SMTP
        const smtpOk = await emailService.testConnection();
        if (!smtpOk) {
            console.error('Falha na conexão SMTP');
            process.exit(1);
        }

        console.log('Iniciando processamento de emails...');
        await emailService.processLeadEmails();
        console.log('Processamento concluído');

        // Encerrar conexões
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Erro no processamento:', error);
        process.exit(1);
    }
}

processEmails();
