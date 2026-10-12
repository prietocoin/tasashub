import express from 'express';
import {
  calcularTasas,
  renderCartelera,
  dispararCartelera,
  dispararLoteGeneral,
  obtenerTasasMonitor,
  obtenerListaSocios,
  actualizarMonedasSocio
} from '../controllers/tasas.controller.js';

const router = express.Router();

// Endpoints Dashboard
router.get('/monitor', obtenerTasasMonitor);
router.get('/socios', obtenerListaSocios);
router.put('/socios/:socio', actualizarMonedasSocio);

// Endpoints Producción Existentes y Disparo Masivo
router.get('/calcular/:socio', calcularTasas);
router.get('/render/:socio', renderCartelera);
router.post('/render', renderCartelera);
router.post('/disparar', dispararCartelera);
router.post('/disparar-lote', dispararLoteGeneral);

export default router;
