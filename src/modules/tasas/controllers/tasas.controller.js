import { obtenerPerfilSocio, obtenerUltimoLoteTasas } from '../services/db.service.js';
import { calcularTasasCartelera } from '../services/calculator.service.js';
import { generarCarteleraPNG } from '../services/renderer.service.js';

export async function calcularTasas(req, res) {
  try {
    const nombreSocio = req.params.socio;
    const perfil = await obtenerPerfilSocio(nombreSocio);
    const loteTasa = await obtenerUltimoLoteTasas();

    const datosCalculados = calcularTasasCartelera(perfil, loteTasa);
    return res.json({ success: true, data: datosCalculados });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function renderCartelera(req, res) {
  try {
    const nombreSocio = req.params.socio || req.body.socio || req.body.nombre_socio;

    let datosCalculados;
    if (req.body && req.body.tarjetas_paises) {
      datosCalculados = req.body;
    } else if (nombreSocio) {
      const perfil = await obtenerPerfilSocio(nombreSocio);
      const loteTasa = await obtenerUltimoLoteTasas();
      datosCalculados = calcularTasasCartelera(perfil, loteTasa);
    } else {
      return res.status(400).json({ success: false, error: 'Debe proporcionar un socio o una estructura válida.' });
    }

    const pngBuffer = await generarCarteleraPNG(datosCalculados);

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    return res.send(pngBuffer);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function dispararCartelera(req, res) {
  try {
    const { socio, jidOverride } = req.body;
    if (!socio) {
      return res.status(400).json({ success: false, error: 'El parámetro socio es requerido.' });
    }

    const perfil = await obtenerPerfilSocio(socio);
    const loteTasa = await obtenerUltimoLoteTasas();
    const datosCalculados = calcularTasasCartelera(perfil, loteTasa);

    const pngBuffer = await generarCarteleraPNG(datosCalculados);
    const base64Image = pngBuffer.toString('base64');

    return res.json({
      success: true,
      socio: datosCalculados.nombre_socio,
      id_grupo: jidOverride || datosCalculados.id_grupo,
      base64: base64Image,
      message: 'Cartelera generada exitosamente lista para envío.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
