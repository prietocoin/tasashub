import pkg from 'pg';
import { generarCarteleraPNG } from '../services/renderer.service.js';

const { Pool } = pkg;

// Configuración de conexión a PostgreSQL / Supabase
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const HOO_GLOBAL_RATES_URL = 'https://hoo.jairokov.com/global-rates';
const JID_GRUPO_PRUEBA = process.env.JID_GRUPO_PRUEBA || '120363000000000000@g.us';
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE;

// -------------------------------------------------------------
// HELPER: Enviar Imagen base64 vía Evolution API
// -------------------------------------------------------------
async function enviarMediaEvolution(jid, base64Data, caption) {
  if (!EVOLUTION_API_URL || !EVOLUTION_INSTANCE) {
    console.log(`[SIMULACIÓN EVOLUTION] Envíado a ${jid}: ${caption}`);
    return { success: true, simulated: true };
  }

  const endpoint = `${EVOLUTION_API_URL}/message/sendMedia/${EVOLUTION_INSTANCE}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': EVOLUTION_API_KEY
    },
    body: JSON.stringify({
      number: jid,
      mediaMessage: {
        mediatype: 'image',
        caption: caption,
        media: base64Data
      }
    })
  });

  return await response.json();
}

// -------------------------------------------------------------
// HELPER: Formatear Tasas para la Cartelera del Socio
// -------------------------------------------------------------
function calcularTasasCartelera(socio, loteActual, loteAnterior) {
  const mapaActual = loteActual?.tasas || {};
  const mapaAnterior = loteAnterior?.tasas || {};
  const configuracionMonedas = socio.monedas || {};

  const tarjetas_paises = Object.entries(configuracionMonedas)
    .filter(([_, conf]) => conf && conf.activo)
    .map(([code, conf]) => {
      const valorActual = parseFloat(mapaActual[code] || 0);
      const valorAnterior = parseFloat(mapaAnterior[code] || 0);

      let trend = 'stable';
      if (valorActual > valorAnterior) trend = 'up';
      else if (valorActual < valorAnterior) trend = 'down';

      // Ajustes/Margen por socio si existen
      const margen = parseFloat(conf.margen || 0);
      const compra = (valorActual + margen).toFixed(2);
      const venta = (valorActual - margen).toFixed(2);

      return {
        code,
        nombre_pais: conf.nombre || code,
        compra,
        venta,
        trend
      };
    });

  const fechaObj = new Date();
  return {
    nombre_socio: socio.nombre,
    tarjetas_paises,
    lote_tasa: loteActual?.id_tasa || 'T000',
    hora_actualizacion: fechaObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
    fecha_actualizacion: fechaObj.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
  };
}

// =============================================================
// CONTROLADORES / ENDPOINTS
// =============================================================

// 1. OBTENER MONITOR GLOBAL (ÚLTIMO LOTE DE tasas_glaukov)
export async function obtenerTasasMonitor(req, res) {
  try {
    const result = await pool.query('SELECT * FROM tasas_glaukov ORDER BY id DESC LIMIT 1');
    if (result.rows.length === 0) {
      return res.json({ success: true, id_tasa: 'T000', tasas: {} });
    }
    const row = result.rows[0];
    return res.json({
      success: true,
      id_tasa: row.id_tasa,
      tasas: row.tasas || {}
    });
  } catch (error) {
    console.error('[Error obtenerTasasMonitor]:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// 2. LISTAR TODOS LOS SOCIOS (perfiles_glaukov)
export async function obtenerListaSocios(req, res) {
  try {
    const result = await pool.query('SELECT * FROM perfiles_glaukov ORDER BY nombre ASC');
    return res.json({ success: true, socios: result.rows });
  } catch (error) {
    console.error('[Error obtenerListaSocios]:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// 3. ACTUALIZAR CONFIGURACIÓN DE UN SOCIO
export async function actualizarMonedasSocio(req, res) {
  try {
    const { socio } = req.params;
    const { monedas, activo, modo_prueba } = req.body;

    const query = `
      UPDATE perfiles_glaukov 
      SET monedas = $1, activo = $2, modo_prueba = $3
      WHERE LOWER(nombre) = LOWER($4)
      RETURNING *;
    `;
    const result = await pool.query(query, [JSON.stringify(monedas), activo, modo_prueba, socio]);

    return res.json({ success: true, socio: result.rows[0] });
  } catch (error) {
    console.error('[Error actualizarMonedasSocio]:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// 4. TRAER BORRADOR DESDE HOO (https://hoo.jairokov.com/global-rates)
export async function traerBorradorHoo(req, res) {
  try {
    const response = await fetch(HOO_GLOBAL_RATES_URL);
    if (!response.ok) throw new Error(`HOO API HTTP Status ${response.status}`);

    const data = await response.json();
    const item = Array.isArray(data) ? data[0] : data;

    // Mapeo minúsculas HOO -> Estructura JSON para la tabla tasas_glaukov
    const borradorMapeado = {
      ID: String(item.id || ''),
      ARS: String(item.ars || 0),
      BOB: Number(item.bob || 0),
      BRL: Number(item.brl || 0),
      CAD: Number(item.cad || 0),
      CLP: String(item.clp || 0),
      COP: String(item.cop || 0),
      CRC: Number(item.crc || 0),
      DOP: Number(item.dop || 0),
      EUR: Number(item.eur || 0),
      MXN: Number(item.mxn || 0),
      PEN: Number(item.pen || 0),
      PYG: Number(item.pyg || 0),
      VES: String(item.ves || 0),
      CREATED_AT: item.created_at || new Date().toISOString()
    };

    return res.json({ success: true, borrador: borradorMapeado });
  } catch (error) {
    console.error('[Error Traer Borrador HOO]:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// 5. SOLO GUARDAR EN BD (INSERT EN tasas_glaukov)
export async function guardarLoteSolo(req, res) {
  try {
    const { tasas } = req.body;

    if (!tasas || typeof tasas !== 'object') {
      return res.status(400).json({ success: false, error: 'Estructura de tasas inválida.' });
    }

    // Calcular id_tasa consecutivo (ejemplo: T068 -> T069)
    const lastRow = await pool.query('SELECT id_tasa FROM tasas_glaukov ORDER BY id DESC LIMIT 1');
    let nextNum = 1;

    if (lastRow.rows.length > 0 && lastRow.rows[0].id_tasa) {
      const currentNum = parseInt(lastRow.rows[0].id_tasa.replace(/\D/g, ''), 10);
      if (!isNaN(currentNum)) nextNum = currentNum + 1;
    }

    const nuevoIdTasa = `T${String(nextNum).padStart(3, '0')}`;

    const objetoTasasCompleto = {
      ...tasas,
      CREATED_AT: tasas.CREATED_AT || new Date().toISOString()
    };

    const query = `
      INSERT INTO tasas_glaukov (id_tasa, tasas)
      VALUES ($1, $2)
      RETURNING *;
    `;
    const result = await pool.query(query, [nuevoIdTasa, JSON.stringify(objetoTasasCompleto)]);

    return res.json({
      success: true,
      id_tasa: nuevoIdTasa,
      registro: result.rows[0]
    });
  } catch (error) {
    console.error('[Error Guardar en tasas_glaukov]:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// 6. SOLO PUBLICAR A SOCIOS EN ON
export async function publicarLoteSolo(req, res) {
  try {
    const { modo_prueba_global } = req.body;

    // Obtener los dos últimos lotes de tasas_glaukov
    const lotes = await pool.query('SELECT * FROM tasas_glaukov ORDER BY id DESC LIMIT 2');
    if (lotes.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'No hay lotes guardados en tasas_glaukov para publicar.' });
    }

    const loteActual = lotes.rows[0];
    const loteAnterior = lotes.rows[1] || lotes.rows[0];

    // Obtener socios
    const sociosRes = await pool.query('SELECT * FROM perfiles_glaukov ORDER BY nombre ASC');
    const socios = sociosRes.rows;

    const resultados = [];

    for (const socio of socios) {
      if (socio.activo === false) continue; // Descartar socios OFF

      try {
        const datosCalculados = calcularTasasCartelera(socio, loteActual, loteAnterior);
        const pngBuffer = await generarCarteleraPNG(datosCalculados);
        const base64Image = pngBuffer.toString('base64');

        const jidDestino = modo_prueba_global
          ? JID_GRUPO_PRUEBA
          : (socio.id_grupo || JID_GRUPO_PRUEBA);

        const caption = `${modo_prueba_global ? '🧪 [PRUEBA]' : '🚀 [OFICIAL]'} Cartelera *${datosCalculados.nombre_socio}* — Lote: ${loteActual.id_tasa}`;

        await enviarMediaEvolution(jidDestino, base64Image, caption);
        resultados.push({ socio: socio.nombre, status: 'ok' });
      } catch (err) {
        resultados.push({ socio: socio.nombre, status: 'error', error: err.message });
      }
    }

    return res.json({
      success: true,
      id_tasa: loteActual.id_tasa,
      procesados: resultados.length,
      detalle: resultados
    });
  } catch (error) {
    console.error('[Error Publicar Lote]:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// 7. RENDERIZAR VISTA PREVIA INDIVIDUAL EN BUFFER PNG
export async function renderCartelera(req, res) {
  try {
    const socioNombre = req.params.socio || req.body.socio;

    const socioRes = await pool.query('SELECT * FROM perfiles_glaukov WHERE LOWER(nombre) = LOWER($1)', [socioNombre]);
    if (socioRes.rows.length === 0) return res.status(404).send('Socio no encontrado');

    const lotes = await pool.query('SELECT * FROM tasas_glaukov ORDER BY id DESC LIMIT 2');
    const loteActual = lotes.rows[0] || {};
    const loteAnterior = lotes.rows[1] || loteActual;

    const datosCalculados = calcularTasasCartelera(socioRes.rows[0], loteActual, loteAnterior);
    const pngBuffer = await generarCarteleraPNG(datosCalculados);

    res.setHeader('Content-Type', 'image/png');
    return res.send(pngBuffer);
  } catch (error) {
    console.error('[Error renderCartelera]:', error.message);
    return res.status(500).send('Error generando PNG');
  }
}

// 8. DISPARAR CARTELERA INDIVIDUAL DE UN SOCIO
export async function dispararCartelera(req, res) {
  try {
    const { socio, modo_prueba } = req.body;

    const socioRes = await pool.query('SELECT * FROM perfiles_glaukov WHERE LOWER(nombre) = LOWER($1)', [socio]);
    if (socioRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Socio no encontrado' });
    }

    const socioData = socioRes.rows[0];
    const lotes = await pool.query('SELECT * FROM tasas_glaukov ORDER BY id DESC LIMIT 2');
    const loteActual = lotes.rows[0] || {};
    const loteAnterior = lotes.rows[1] || loteActual;

    const datosCalculados = calcularTasasCartelera(socioData, loteActual, loteAnterior);
    const pngBuffer = await generarCarteleraPNG(datosCalculados);
    const base64Image = pngBuffer.toString('base64');

    const jidDestino = modo_prueba
      ? JID_GRUPO_PRUEBA
      : (socioData.id_grupo || JID_GRUPO_PRUEBA);

    const caption = `${modo_prueba ? '🧪 [PRUEBA]' : '🚀 [OFICIAL]'} Cartelera *${socioData.nombre}* — Lote: ${loteActual.id_tasa || 'T000'}`;

    await enviarMediaEvolution(jidDestino, base64Image, caption);

    return res.json({ success: true, socio: socioData.nombre });
  } catch (error) {
    console.error('[Error dispararCartelera]:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// 9. DISPARAR LOTE COMPLETO (COMPATIBILIDAD ANTERIOR)
export async function dispararLoteGeneral(req, res) {
  return await publicarLoteSolo(req, res);
}
