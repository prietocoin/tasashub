import {
  obtenerUltimosDosLotesTasas,
  obtenerPerfilSocio,
} from '../services/db.service.js';
import { calcularTasasCartelera } from '../services/calculator.service.js';
import { generarCarteleraPNG } from '../services/renderer.service.js';
import { obtenerUltimoLoteTasas, obtenerTodosLosSocios, actualizarConfiguracionSocio } from '../services/db.service.js';

export async function obtenerTasasMonitor(req, res) {
  try {
    const lote = await obtenerUltimoLoteTasas();
    return res.json({ success: true, id_tasa: lote.id_tasa, tasas: lote.tasas });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function obtenerListaSocios(req, res) {
  try {
    const socios = await obtenerTodosLosSocios();
    return res.json({ success: true, socios });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function actualizarMonedasSocio(req, res) {
  try {
    const nombreSocio = req.params.socio;
    const { monedas } = req.body;
    const perfil = await actualizarConfiguracionSocioBD(nombreSocio, monedas);
    return res.json({ success: true, perfil });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
// Extrae el socio de los parámetros sin importar cómo se nombró en la ruta
function extraerNombreSocio(req) {
  return (
    req.params.nombreSocio ||
    req.params.socio ||
    req.params.nombre_socio ||
    Object.values(req.params)[0]
  );
}

export async function renderCartelera(req, res) {
  try {
    const nombreSocio = extraerNombreSocio(req);

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
    const nombreSocio = extraerNombreSocio(req);

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
    const nombreSocio = extraerNombreSocio(req);

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
