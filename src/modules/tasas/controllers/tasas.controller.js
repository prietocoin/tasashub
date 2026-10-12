import {
  obtenerUltimoLoteTasas,
  obtenerUltimosDosLotesTasas,
  obtenerPerfilSocio,
  obtenerTodosLosSocios,
  actualizarConfiguracionSocioBD
} from '../services/db.service.js';
import { calcularTasasCartelera } from '../services/calculator.service.js';
import { generarCarteleraPNG } from '../services/renderer.service.js';

// Extrae el socio de PARAMS o de BODY (soporta GET / socio en URL y POST con JSON body)
function extraerNombreSocio(req) {
  return (
    req.body?.socio ||
    req.body?.nombre ||
    req.body?.nombreSocio ||
    req.params?.nombreSocio ||
    req.params?.socio ||
    req.params?.nombre_socio ||
    (req.params ? Object.values(req.params)[0] : null)
  );
}

// -------------------------------------------------------------
// NUEVOS ENDPOINTS PARA EL DASHBOARD FRONTEND
// -------------------------------------------------------------

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
    const nombreSocio = extraerNombreSocio(req);
    const { monedas } = req.body;
    const perfil = await actualizarConfiguracionSocioBD(nombreSocio, monedas);
    return res.json({ success: true, perfil });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// -------------------------------------------------------------
// ENDPOINTS EXISTENTES
// -------------------------------------------------------------

export async function renderCartelera(req, res) {
  try {
    const nombreSocio = extraerNombreSocio(req);

    if (!nombreSocio) {
      return res.status(400).json({ success: false, error: 'Nombre de socio no especificado.' });
    }

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

    if (!nombreSocio) {
      return res.status(400).json({ success: false, error: 'Nombre de socio no especificado.' });
    }

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

    if (!nombreSocio) {
      return res.status(400).json({ 
        success: false, 
        error: 'El nombre del socio no fue proporcionado en la petición.' 
      });
    }

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
    console.error('[Error Controller Disparar]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
