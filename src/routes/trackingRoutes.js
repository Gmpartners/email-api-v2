const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/trackingController');

// Rota para pixel de rastreamento
router.get('/track/open/:emailId/:leadId.png', trackingController.trackOpen);

// Rota para cliques em links
router.get('/track/click/:emailId/:leadId', trackingController.trackClick);

module.exports = router;
