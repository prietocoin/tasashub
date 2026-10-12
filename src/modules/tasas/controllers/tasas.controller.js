import {
  obtenerUltimoLoteTasas,
  obtenerUltimosDosLotesTasas,
  obtenerPerfilSocio,
  obtenerTodosLosSocios,
  actualizarConfiguracionSocioBD
} from '../services/db.service.js';
import { calcularTasasCartelera } from '../services/calculator.service.js';
import { generarCarteleraPNG } from '../services/renderer.service.js';
import { env } from '../../../config/env.js';

// Fallbacks directos para evitar 'undefined' en la construcción de la URL
const DEFAULT_EVOLUTION_URL = 'https://automatizaciones-evolution-api.eo3pev.easypanel.host';
const DEFAULT_API_KEY = '429683C4C977415CAAFCCE10F7D57E11';
const INSTANCIA_EVOLUTION = env?.EVOLUTION_INSTANCE || process.env.EVOLUTION_INSTANCE || 'Jairo';
const JID_GRUPO_PRUEBA = env?.JID_GRUPO_PRUEBA || process.env.JID_GRUPO_PRUEBA || '120363421142957552@g.us';

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

// Función limpia para despachar medios a Evolution API v1 / v2 securizada
async function enviarMediaEvolution(jidDestino, base64PureImage, caption = '') {
  const rawUrl = env?.EVOLUTION_API_URL || process.env.EVOLUTION_API_URL || DEFAULT_EVOLUTION_URL;
  const baseUrl = rawUrl.replace(/\/$/, '');
  const apiKey = env?.AUTHENTICATION_API_KEY || process.env.AUTHENTICATION_API_KEY || DEFAULT_API_KEY;

  const url = `${baseUrl}/message/sendMedia/${INSTANCIA_EVOLUTION}`;

  // Payload exacto requerido por Evolution API sendMedia
  const payload = {
    number: jidDestino,
    mediatype: 'image',
    media: base64PureImage, // Base64 puro sin prefijos "data:image/png;base64,"
    fileName: 'cartelera.png',
    caption: caption
  };

  console.log(`[Evolution API] Enviando a: ${url} - Destino: ${jidDestino}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': apiKey
    },
    body: JSON.stringify(payload)
  });

  const responseText = await response.text();
  let data;
  try {
    data = JSON.parse(responseText);
  } catch (e) {
    data = { raw: responseText };
  }

  if (!response.ok) {
    console.error('[Evolution API Error Response]:', response.status, data);
    throw new Error(`Evolution API status ${response.status}: ${data.message || JSON.stringify(data)}`);
  }

  return data;
}

// -------------------------------------------------------------
// ENDPOINTS FRONTEND
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
// RENDER & DISPARAR
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
    const { modo_prueba } = req.body;

    if (!nombreSocio) {
      return res.status(400).json({ 
        success: false, 
        error: 'El nombre del socio no fue proporcionado.' 
      });
    }

    // 1. Obtener datos del socio y tasas
    const perfil = await obtenerPerfilSocio(nombreSocio);
    const { loteActual, loteAnterior } = await obtenerUltimosDosLotesTasas();

    // 2. Calcular y renderizar PNG
    const datosCalculados = calcularTasasCartelera(perfil, loteActual, loteAnterior);
    const pngBuffer = await generarCarteleraPNG(datosCalculados);
    const pureBase64 = pngBuffer.toString('base64');

    // 3. Determinar JID del Grupo Destino
    const jidDestino = modo_prueba 
      ? JID_GRUPO_PRUEBA 
      : (perfil.id_grupo || JID_GRUPO_PRUEBA);

    const caption = `${modo_prueba ? '🧪 [PRUEBA]' : '🚀 [OFICIAL]'} Cartelera *${datosCalculados.nombre_socio}* — Lote: ${datosCalculados.lote_tasa}`;

    // 4. Enviar a Evolution API
    const evolutionResult = await enviarMediaEvolution(jidDestino, pureBase64, caption);

    return res.json({
      success: true,
      id_grupo: jidDestino,
      nombre_socio: datosCalculados.nombre_socio,
      modo_prueba: !!modo_prueba,
      evolution: evolutionResult
    });
  } catch (error) {
    console.error('[Error Controller Disparar]:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// DISPARAR LOTE COMPLETO
export async function dispararLoteGeneral(req, res) {
  try {
    const { modo_prueba_global } = req.body;
    const socios = await obtenerTodosLosSocios();
    const { loteActual, loteAnterior } = await obtenerUltimosDosLotesTasas();

    const resultados = [];

    for (const socio of socios) {
      if (socio.activo === false) continue;

      try {
        const datosCalculados = calcularTasasCartelera(socio, loteActual, loteAnterior);
        const pngBuffer = await generarCarteleraPNG(datosCalculados);
        const pureBase64 = pngBuffer.toString('base64');

        const jidDestino = modo_prueba_global 
          ? JID_GRUPO_PRUEBA 
          : (socio.id_grupo || JID_GRUPO_PRUEBA);

        const caption = `${modo_prueba_global ? '🧪 [LOTE PRUEBA]' : '🚀 [LOTE OFICIAL]'} Cartelera *${datosCalculados.nombre_socio}*`;

        await enviarMediaEvolution(jidDestino, pureBase64, caption);
        resultados.push({ socio: socio.nombre, status: 'ok', jid: jidDestino });
      } catch (err) {
        resultados.push({ socio: socio.nombre, status: 'error', error: err.message });
      }
    }

    return res.json({ success: true, procesados: resultados.length, detalle: resultados });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
