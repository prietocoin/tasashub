import {
  obtenerUltimosDosLotesTasas,
  obtenerPerfilSocio,
} from '../services/db.service.js';
import { calcularTasasCartelera } from '../services/calculator.service.js';
import { generarCarteleraPNG } from '../services/renderer.service.js';

export async function renderCartelera(req, res) {
  try {
    const { nombreSocio } = req.params;

    const perfil = await obtenerPerfilSocio(nombreSocio);
    const { loteActual, loteAnterior } = await obtenerUltimosDosLotesTasas();

    const datosCalculados = calcularTasasCartelera(perfil, loteActual, loteAnterior);
    const pngBuffer = await generarCarteleraPNG(datosCalculados);

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache');
    return res.send(pngBuffer);
  } catch (error) {
    console.error('[Error Controller Render]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function calcularTasas(req, res) {
  try {
    const { nombreSocio } = req.params;

    const perfil = await obtenerPerfilSocio(nombreSocio);
    const { loteActual, loteAnterior } = await obtenerUltimosDosLotesTasas();

    const datosCalculados = calcularTasasCartelera(perfil, loteActual, loteAnterior);

    return res.json({ success: true, data: datosCalculados });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function dispararCartelera(req, res) {
  try {
    const { nombreSocio } = req.params;

    const perfil = await obtenerPerfilSocio(nombreSocio);
    const { loteActual, loteAnterior } = await obtenerUltimosDosLotesTasas();

    const datosCalculados = calcularTasasCartelera(perfil, loteActual, loteAnterior);
    const pngBuffer = await generarCarteleraPNG(datosCalculados);

    return res.json({
      success: true,
      id_grupo: datosCalculados.id_grupo,
      nombre_socio: datosCalculados.nombre_socio,
      base64: pngBuffer.toString('base64'),
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
