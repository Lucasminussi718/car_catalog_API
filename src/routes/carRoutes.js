// src/routes/carRoutes.js
const express = require('express');
const router = express.Router();
const carController = require('../controllers/carController');

// Prefixo: /webmob/
router.get('/webmob/healthcheck', carController.healthCheck);

// CRUD para Carros
router.get('/webmob/cars', carController.listCars);
router.post('/webmob/cars', carController.addCar);
router.put('/webmob/cars/:id', carController.updateCar);
router.delete('/webmob/cars/:id', carController.deleteCar);

// Comparação de Carros
router.get('/webmob/cars/compare', carController.compareCars);

module.exports = router;
