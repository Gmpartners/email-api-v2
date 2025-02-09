const Lead = require('../models/lead');
const Campaign = require('../models/campaign');
const Email = require('../models/email');
const queueService = require('../services/queueService');
const emailService = require('../services/emailService');

const leadController = {
    // Criar um novo lead
    async create(req, res) {
        try {
            const { campaignId } = req.params;
            const { email, name } = req.body;

            // Verificar se a campanha existe e está ativa
            const campaign = await Campaign.findOne({ campaignId });
            if (!campaign) {
                return res.status(404).json({
                    success: false,
                    message: 'Campanha não encontrada'
                });
            }

            // Verificar se o lead já existe nesta campanha
            const existingLead = await Lead.findOne({ email, campaignId });
            if (existingLead) {
                return res.status(400).json({
                    success: false,
                    message: 'Este email já está registrado nesta campanha'
                });
            }

            // Criar o lead
            const lead = new Lead({
                email,
                name: name || '',
                campaignId,
                currentPosition: 1,
                status: 'active'
            });

            await lead.save();

            // Se a campanha estiver ativa, iniciar a sequência de emails
            if (campaign.status === 'active') {
                // Buscar todos os emails da campanha
                const emails = await Email.find({ campaignId }).sort('position');
                
                if (emails.length > 0) {
                    // Enviar o primeiro email imediatamente
                    const firstEmail = emails[0];
                    await emailService.sendEmail(lead, firstEmail);
                    
                    // Atualizar o histórico e posição do lead
                    await lead.recordEmailSent(firstEmail.emailId);
                    lead.currentPosition = 2; // Avançar para a próxima posição
                    await lead.save();

                    console.log(`Email 1 enviado e posição atualizada para ${lead.email}`);

                    // Agendar os próximos emails
                    for (let i = 1; i < emails.length; i++) {
                        const email = emails[i];
                        const scheduledTime = new Date();
                        const delayMillis = emailService.calculateDelayMilliseconds(email.delay);
                        scheduledTime.setTime(scheduledTime.getTime() + delayMillis);

                        await queueService.addToQueue(lead, email, scheduledTime);
                    }

                    console.log(`Sequência iniciada para o lead ${lead.email}`);
                }
            }

            res.status(201).json({
                success: true,
                data: lead,
                message: 'Lead adicionado à campanha com sucesso'
            });
        } catch (error) {
            console.error('Erro ao criar lead:', error);
            res.status(400).json({
                success: false,
                error: error.message,
                message: 'Erro ao adicionar lead'
            });
        }
    },

    // Remover lead da campanha
    async remove(req, res) {
        try {
            const { campaignId, email } = req.params;

            const lead = await Lead.findOne({ email, campaignId });
            if (!lead) {
                return res.status(404).json({
                    success: false,
                    message: 'Lead não encontrado'
                });
            }

            // Atualizar status para unsubscribed
            lead.status = 'unsubscribed';
            await lead.save();

            // Remover emails pendentes da fila
            const queueKey = `email:queue:${campaignId}:${lead._id}`;
            await redisClient.del(queueKey);

            res.json({
                success: true,
                message: 'Lead removido da campanha com sucesso'
            });
        } catch (error) {
            console.error('Erro ao remover lead:', error);
            res.status(400).json({
                success: false,
                error: error.message,
                message: 'Erro ao remover lead'
            });
        }
    },

    // Listar leads de uma campanha
    async list(req, res) {
        try {
            const { campaignId } = req.params;
            const { status, page = 1, limit = 50 } = req.query;

            let query = { campaignId };
            if (status) {
                query.status = status;
            }

            const skip = (page - 1) * limit;

            const leads = await Lead.find(query)
                .sort('-createdAt')
                .skip(skip)
                .limit(parseInt(limit))
                .select('-__v');

            const total = await Lead.countDocuments(query);

            res.json({
                success: true,
                data: {
                    leads,
                    pagination: {
                        total,
                        page: parseInt(page),
                        pages: Math.ceil(total / limit)
                    }
                },
                message: 'Leads listados com sucesso'
            });
        } catch (error) {
            console.error('Erro ao listar leads:', error);
            res.status(400).json({
                success: false,
                error: error.message,
                message: 'Erro ao listar leads'
            });
        }
    },

    // Obter detalhes de um lead específico
    async get(req, res) {
        try {
            const { campaignId, email } = req.params;

            const lead = await Lead.findOne({ email, campaignId })
                .select('-__v')
                .populate('emailHistory');

            if (!lead) {
                return res.status(404).json({
                    success: false,
                    message: 'Lead não encontrado'
                });
            }

            res.json({
                success: true,
                data: lead,
                message: 'Detalhes do lead recuperados com sucesso'
            });
        } catch (error) {
            console.error('Erro ao buscar lead:', error);
            res.status(400).json({
                success: false,
                error: error.message,
                message: 'Erro ao buscar lead'
            });
        }
    },

    // Atualizar status do lead
    async updateStatus(req, res) {
        try {
            const { campaignId, email } = req.params;
            const { status } = req.body;

            if (!['active', 'unsubscribed', 'completed'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Status inválido'
                });
            }

            const lead = await Lead.findOne({ email, campaignId });
            if (!lead) {
                return res.status(404).json({
                    success: false,
                    message: 'Lead não encontrado'
                });
            }

            lead.status = status;
            await lead.save();

            // Se status for unsubscribed, remover emails pendentes da fila
            if (status === 'unsubscribed') {
                const queueKey = `email:queue:${campaignId}:${lead._id}`;
                await redisClient.del(queueKey);
            }

            res.json({
                success: true,
                data: lead,
                message: 'Status do lead atualizado com sucesso'
            });
        } catch (error) {
            console.error('Erro ao atualizar status do lead:', error);
            res.status(400).json({
                success: false,
                error: error.message,
                message: 'Erro ao atualizar status do lead'
            });
        }
    }
};

module.exports = leadController;
