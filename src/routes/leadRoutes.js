const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');

// Adicionar lead à campanha
router.post('/:userId/campaign/:campaignId/lead/create', leadController.create);

// Remover lead da campanha
router.delete('/:userId/campaign/:campaignId/lead/:email', leadController.remove);

// Listar leads da campanha
router.get('/:userId/campaign/:campaignId/lead', leadController.list);

// Obter detalhes de um lead específico
router.get('/:userId/campaign/:campaignId/lead/:email', leadController.get);

module.exports = router;
