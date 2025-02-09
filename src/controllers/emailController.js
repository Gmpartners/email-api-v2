const Email = require('../models/email');
const Campaign = require('../models/campaign');

const emailController = {
    async create(req, res) {
        try {
            const { campaignId } = req.params;
            const { 
                label,
                fromName,
                fromEmail,
                subject, 
                htmlContent, 
                position, 
                delay 
            } = req.body;

            // Verificar se a campanha existe
            const campaign = await Campaign.findOne({ campaignId });
            if (!campaign) {
                return res.status(404).json({
                    success: false,
                    message: 'Campanha não encontrada'
                });
            }

            // Verificar se já existe um email com esta posição
            const existingEmailWithPosition = await Email.findOne({
                campaignId,
                position
            });

            if (existingEmailWithPosition) {
                return res.status(400).json({
                    success: false,
                    message: 'Já existe um email nesta posição'
                });
            }

            const email = new Email({
                campaignId,
                label,
                fromName,
                fromEmail,
                subject,
                htmlContent,
                position,
                delay: {
                    value: parseInt(delay.value),
                    unit: delay.unit
                }
            });

            console.log('Email a ser criado:', email);

            await email.save();

            res.status(201).json({
                success: true,
                data: email,
                message: 'Email criado com sucesso'
            });
        } catch (error) {
            console.error('Erro ao criar email:', error);
            res.status(400).json({
                success: false,
                error: error.message,
                message: 'Erro ao criar email'
            });
        }
    },

    async update(req, res) {
        try {
            const { emailId } = req.params;
            const updateData = req.body;

            const email = await Email.findOne({ emailId });
            if (!email) {
                return res.status(404).json({
                    success: false,
                    message: 'Email não encontrado'
                });
            }

            // Se estiver atualizando a posição, verificar se já existe email nesta posição
            if (updateData.position && updateData.position !== email.position) {
                const existingEmailWithPosition = await Email.findOne({
                    campaignId: email.campaignId,
                    position: updateData.position,
                    emailId: { $ne: emailId }
                });

                if (existingEmailWithPosition) {
                    return res.status(400).json({
                        success: false,
                        message: 'Já existe um email nesta posição'
                    });
                }
            }

            // Se estiver atualizando o delay, garantir o formato correto
            if (updateData.delay) {
                updateData.delay = {
                    value: parseInt(updateData.delay.value),
                    unit: updateData.delay.unit
                };
            }

            Object.assign(email, updateData);
            await email.save();

            res.json({
                success: true,
                data: email,
                message: 'Email atualizado com sucesso'
            });
        } catch (error) {
            console.error('Erro ao atualizar email:', error);
            res.status(400).json({
                success: false,
                error: error.message,
                message: 'Erro ao atualizar email'
            });
        }
    },

    async delete(req, res) {
        try {
            const { emailId } = req.params;

            const email = await Email.findOne({ emailId });
            if (!email) {
                return res.status(404).json({
                    success: false,
                    message: 'Email não encontrado'
                });
            }

            await email.deleteOne();

            // Reordenar as posições dos emails restantes
            const remainingEmails = await Email.find({ 
                campaignId: email.campaignId,
                position: { $gt: email.position }
            }).sort('position');

            for (const remainingEmail of remainingEmails) {
                remainingEmail.position -= 1;
                await remainingEmail.save();
            }

            res.json({
                success: true,
                message: 'Email deletado com sucesso'
            });
        } catch (error) {
            console.error('Erro ao deletar email:', error);
            res.status(400).json({
                success: false,
                error: error.message,
                message: 'Erro ao deletar email'
            });
        }
    },

    async list(req, res) {
        try {
            const { campaignId } = req.params;
            
            const emails = await Email.find({ campaignId })
                .sort('position');

            res.json({
                success: true,
                data: emails,
                message: 'Emails listados com sucesso'
            });
        } catch (error) {
            console.error('Erro ao listar emails:', error);
            res.status(400).json({
                success: false,
                error: error.message,
                message: 'Erro ao listar emails'
            });
        }
    }
};

module.exports = emailController;
