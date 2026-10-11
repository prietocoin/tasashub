import express from 'express';
import { calcularTasas, renderCartelera, dispararCartelera } from '../controllers/tasas.controller.js';

const router = express.Router();

router.get('/calcular/:socio', calcularTasas);
router.get('/render/:socio', renderCartelera);
router.post('/render', renderCartelera);
router.post('/disparar', dispararCartelera);
router.get('/monitor', obtenerTasasMonitor);
router.get('/socios', obtenerListaSocios);
router.put('/socios/:socio', actualizarMonedasSocio);

export default router;
