import express from 'express';
import {
  calcularTasas,
  renderCartelera,
  dispararCartelera,
  obtenerTasasMonitor,
  obtenerListaSocios,
  actualizarMonedasSocio
} from '../controllers/tasas.controller.js';

const router = express.Router();

// Endpoints Dashboard
router.get('/monitor', obtenerTasasMonitor);
router.get('/socios', obtenerListaSocios);
router.put('/socios/:socio', actualizarMonedasSocio);

// Endpoints Producción Existentes
router.get('/calcular/:socio', calcularTasas);
router.get('/render/:socio', renderCartelera);
router.post('/render', renderCartelera);
router.post('/disparar', dispararCartelera);

export default router;
