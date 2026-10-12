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

// Instancia y JID por defecto
const INSTANCIA_EVOLUTION = env.EVOLUTION_INSTANCE || 'Jairo';
const JID_GRUPO_PRUEBA = env.JID_GRUPO_PRUEBA || '120363421142957552@g.us';

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

// Función que despacha directamente a Evolution API (Soporta API v1 y v2)
async function enviarMediaEvolution(jidDestino, base64Image, caption = '') {
  const baseUrl = env.EVOLUTION_API_URL?.replace(/\/$/, '');
  const url = `${baseUrl}/message/sendMedia/${INSTANCIA_EVOLUTION}`;
  const apiKey = env.AUTHENTICATION_API_KEY || env.EVOLUTION_API_KEY;

  // Formato multiversión para Evolution API (remoteJid / number + media / mediaMessage)
  const payload = {
    number: jidDestino,
    remoteJid: jidDestino,
    media: `data:image/png;base64,${base64Image}`,
    mediaType: 'image',
    caption: caption,
    mediaMessage: {
      mediatype: 'image',
      caption: caption,
      media: `data:image/png;base64,${base64Image}`
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': apiKey,
      'Authorization': `Bearer ${apiKey}`
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
    console.error('[Evolution API HTTP Error]:', response.status, data);
    throw new Error(`Evolution API HTTP ${response.status}: ${data.message || data.error || JSON.stringify(data)}`);
  }

  return data;
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
    const { modo_prueba } = req.body;

    if (!nombreSocio) {
      return res.status(400).json({ 
        success: false, 
        error: 'El nombre del socio no fue proporcionado en la petición.' 
      });
    }

    // 1. Obtener datos del socio y lotes de tasas
    const perfil = await obtenerPerfilSocio(nombreSocio);
    const { loteActual, loteAnterior } = await obtenerUltimosDosLotesTasas();

    // 2. Calcular y generar PNG
    const datosCalculados = calcularTasasCartelera(perfil, loteActual, loteAnterior);
    const pngBuffer = await generarCarteleraPNG(datosCalculados);
    const base64Image = pngBuffer.toString('base64');

    // 3. Determinar JID de destino (Si modo_prueba es true -> Grupo de Prueba, sino -> perfil.id_grupo)
    const jidDestino = modo_prueba 
      ? JID_GRUPO_PRUEBA 
      : (perfil.id_grupo || JID_GRUPO_PRUEBA);

    const caption = `${modo_prueba ? '🧪 [PRUEBA]' : '🚀 [OFICIAL]'} Cartelera *${datosCalculados.nombre_socio}* — Lote: ${datosCalculados.lote_tasa}`;

    // 4. Enviar a Evolution API (Asegura que si falla, eleva el error)
    const evolutionResponse = await enviarMediaEvolution(jidDestino, base64Image, caption);

    return res.json({
      success: true,
      id_grupo: jidDestino,
      nombre_socio: datosCalculados.nombre_socio,
      base64: base64Image,
      modo_prueba: !!modo_prueba,
      evolution: evolutionResponse
    });
  } catch (error) {
    console.error('[Error Controller Disparar]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
