const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');

// Criar email na campanha
router.post('/:userId/campaign/:campaignId/email/create', emailController.create);

// Atualizar email da campanha
router.put('/:userId/campaign/:campaignId/email/:emailId', emailController.update);

// Deletar email da campanha
router.delete('/:userId/campaign/:campaignId/email/:emailId', emailController.delete);

// Listar emails da campanha
router.get('/:userId/campaign/:campaignId/email', emailController.list);

module.exports = router;
