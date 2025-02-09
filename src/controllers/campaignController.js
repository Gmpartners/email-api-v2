const Campaign = require('../models/campaign');

const campaignController = {
    // Criar uma nova campanha
    async create(req, res) {
        try {
            console.log('Dados recebidos:', req.body); // Para debug

            const { campaignId, name, description, type } = req.body;
            const userId = req.params.userId || 'default-user';

            const campaign = new Campaign({
                campaignId: campaignId.trim(),
                name: name.trim(),
                description: description ? description.trim() : '',
                userId,
                type: type || 'sequence'
            });

            console.log('Campanha a ser criada:', campaign); // Para debug

            await campaign.save();

            res.status(201).json({
                success: true,
                data: campaign,
                message: 'Campanha criada com sucesso'
            });
        } catch (error) {
            console.error('Erro completo:', error); // Para debug
            res.status(400).json({
                success: false,
                error: error.message,
                message: 'Erro ao criar campanha'
            });
        }
    },

    // Atualizar status da campanha
    async updateStatus(req, res) {
        try {
            const { campaignId } = req.params;
            const { status } = req.body;

            if (!['active', 'inactive'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Status inválido. Use "active" ou "inactive"'
                });
            }

            const campaign = await Campaign.findOne({ campaignId });

            if (!campaign) {
                return res.status(404).json({
                    success: false,
                    message: 'Campanha não encontrada'
                });
            }

            if (status === 'active') {
                await campaign.activate();
            } else {
                await campaign.deactivate();
            }

            res.json({
                success: true,
                data: campaign,
                message: `Campanha ${status === 'active' ? 'ativada' : 'desativada'} com sucesso`
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message,
                message: 'Erro ao atualizar status da campanha'
            });
        }
    },

    // Listar campanhas
    async list(req, res) {
        try {
            const userId = req.params.userId || 'default-user';
            const campaigns = await Campaign.find({ userId }).sort('-createdAt');

            res.json({
                success: true,
                data: campaigns,
                message: 'Campanhas listadas com sucesso'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message,
                message: 'Erro ao listar campanhas'
            });
        }
    },

    // Obter detalhes de uma campanha específica
    async get(req, res) {
        try {
            const { campaignId } = req.params;
            const campaign = await Campaign.findOne({ campaignId });

            if (!campaign) {
                return res.status(404).json({
                    success: false,
                    message: 'Campanha não encontrada'
                });
            }

            res.json({
                success: true,
                data: campaign,
                message: 'Detalhes da campanha recuperados com sucesso'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message,
                message: 'Erro ao recuperar detalhes da campanha'
            });
        }
    }
};

module.exports = campaignController;
