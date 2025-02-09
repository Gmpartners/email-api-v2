const redisClient = require('../config/redis');
const emailService = require('./emailService');
const Lead = require('../models/lead');
const Email = require('../models/email');

class QueueService {
    constructor() {
        this.processQueueInterval = null;
    }

    async addToQueue(lead, emailData, scheduledTime) {
        try {
            console.log(`Agendando email ${emailData.emailId} (posição ${emailData.position}) para ${lead.email} em ${scheduledTime}`);
            
            const queueData = {
                leadId: lead._id.toString(),
                leadEmail: lead.email,
                emailId: emailData.emailId,
                campaignId: emailData.campaignId,
                position: emailData.position,
                scheduledTime: scheduledTime.getTime()
            };

            const queueKey = `email:queue:${emailData.campaignId}:${lead._id}`;
            
            await redisClient.zAdd(
                queueKey,
                {
                    score: scheduledTime.getTime(),
                    value: JSON.stringify(queueData)
                }
            );

            console.log(`Email ${emailData.emailId} agendado com sucesso para ${lead.email}`);
            return true;
        } catch (error) {
            console.error('Erro ao adicionar email à fila:', error);
            return false;
        }
    }

    async startProcessing() {
        if (this.processQueueInterval) {
            console.log('Processamento já está em execução');
            return;
        }

        console.log('Iniciando processamento da fila de emails');

        this.processQueueInterval = setInterval(async () => {
            try {
                const now = new Date().getTime();
                
                // Buscar todas as chaves de fila
                const queueKeys = await redisClient.keys('email:queue:*');
                
                for (const queueKey of queueKeys) {
                    const items = await redisClient.zRangeByScore(
                        queueKey,
                        0,
                        now
                    );

                    // Ordenar itens por posição
                    const sortedItems = items
                        .map(item => JSON.parse(item))
                        .sort((a, b) => a.position - b.position);

                    for (const queueData of sortedItems) {
                        const lead = await Lead.findById(queueData.leadId);
                        
                        // Verificar se o email anterior já foi enviado
                        if (queueData.position > 1) {
                            const previousPosition = queueData.position - 1;
                            const emailHistory = lead.emailHistory || [];
                            
                            // Buscar emails anteriores de forma síncrona
                            const previousEmails = await Promise.all(
                                emailHistory.map(history => 
                                    Email.findOne({ emailId: history.emailId })
                                )
                            );
                            
                            const previousEmailSent = previousEmails.some(email => 
                                email && email.position === previousPosition
                            );

                            if (!previousEmailSent) {
                                console.log(`Aguardando envio do email anterior para ${lead.email}`);
                                continue;
                            }
                        }

                        await this.processQueueItem(JSON.stringify(queueData));
                        await redisClient.zRem(queueKey, JSON.stringify(queueData));
                    }
                }
            } catch (error) {
                console.error('Erro ao processar fila:', error);
            }
        }, 1000);
    }

    async processQueueItem(item) {
        try {
            const queueData = JSON.parse(item);
            
            const lead = await Lead.findById(queueData.leadId);
            if (!lead) {
                console.error('Lead não encontrado:', queueData.leadId);
                return;
            }

            const email = await Email.findOne({ emailId: queueData.emailId });
            if (!email) {
                console.error('Email não encontrado:', queueData.emailId);
                return;
            }

            // Verificar se é o próximo email na sequência
            if (email.position !== lead.currentPosition) {
                console.log(`Aguardando posição correta para ${lead.email} (atual: ${lead.currentPosition}, email: ${email.position})`);
                return;
            }

            // Enviar o email
            await emailService.sendEmail(lead, email);
            
            // Atualizar o histórico e posição do lead
            await lead.recordEmailSent(email.emailId);
            lead.currentPosition += 1;
            await lead.save();
            
            console.log(`Email ${email.emailId} (posição ${email.position}) processado com sucesso para ${lead.email}`);
        } catch (error) {
            console.error('Erro ao processar item da fila:', error);
        }
    }

    stopProcessing() {
        if (this.processQueueInterval) {
            clearInterval(this.processQueueInterval);
            this.processQueueInterval = null;
            console.log('Processamento da fila parado');
        }
    }

    isProcessing() {
        return !!this.processQueueInterval;
    }
}

module.exports = new QueueService();
