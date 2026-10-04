import express from 'express';
import { calcularTasas, renderCartelera, dispararCartelera } from '../controllers/tasas.controller.js';

const router = express.Router();

router.get('/calcular/:socio', calcularTasas);
router.get('/render/:socio', renderCartelera);
router.post('/render', renderCartelera);
router.post('/disparar', dispararCartelera);

export default router;
