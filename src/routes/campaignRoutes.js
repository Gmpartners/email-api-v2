const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');

// Criar campanha
router.post('/:userId/campaign/create', campaignController.create);

// Atualizar status da campanha
router.put('/:userId/campaign/:campaignId/status', campaignController.updateStatus);

// Listar campanhas do usuário
router.get('/:userId/campaign', campaignController.list);

// Obter detalhes de uma campanha específica
router.get('/:userId/campaign/:campaignId', campaignController.get);

module.exports = router;
