const Email = require('../models/email');
const Lead = require('../models/lead');

const trackingController = {
    // Registrar abertura de email
    async trackOpen(req, res) {
        try {
            const { emailId, leadId } = req.params;

            // Encontrar o email
            const email = await Email.findOne({ emailId });
            if (!email) {
                return res.status(404).send('Not found');
            }

            // Encontrar o lead
            const lead = await Lead.findById(leadId);
            if (!lead) {
                return res.status(404).send('Not found');
            }

            // Incrementar contagem de aberturas
            await email.incrementStat('opens');

            // Enviar pixel transparente
            res.set('Content-Type', 'image/png');
            res.send(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64'));
        } catch (error) {
            console.error('Erro ao registrar abertura:', error);
            res.status(500).send('Internal error');
        }
    },

    // Registrar clique em link
    async trackClick(req, res) {
        try {
            const { emailId, leadId } = req.params;
            const { url } = req.query;

            if (!url) {
                return res.status(400).json({
                    success: false,
                    message: 'URL não fornecida'
                });
            }

            // Encontrar o email
            const email = await Email.findOne({ emailId });
            if (!email) {
                return res.status(404).json({
                    success: false,
                    message: 'Email não encontrado'
                });
            }

            // Incrementar contagem de cliques
            await email.incrementStat('clicks');

            // Redirecionar para URL original
            res.redirect(url);
        } catch (error) {
            console.error('Erro ao registrar clique:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno'
            });
        }
    }
};

module.exports = trackingController;
