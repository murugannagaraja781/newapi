const express = require('express');
const router = express.Router();
const chartController = require('../controllers/chartController');

router.post('/birth-chart', chartController.getBirthChart);

module.exports = router;
