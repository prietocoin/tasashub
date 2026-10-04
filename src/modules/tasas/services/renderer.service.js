import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import fs from 'fs';
import path from 'path';
import { renderCarteleraTemplate } from '../templates/cartelera.template.js';

let fontBuffer = null;

function obtenerFuente() {
  if (!fontBuffer) {
    const fontPath = path.join(process.cwd(), 'assets/fonts/Inter-Bold.ttf');
    if (!fs.existsSync(fontPath)) {
      throw new Error(`Archivo de fuente no encontrado en: ${fontPath}`);
    }
    fontBuffer = fs.readFileSync(fontPath);
  }
  return fontBuffer;
}

// Carga banderas en Base64 desde assets/flags/ (ej. ar.svg, br.png)
export function cargarImagenBase64Local(relativePath) {
  try {
    const fullPath = path.join(process.cwd(), relativePath);
    if (!fs.existsSync(fullPath)) return null;

    const fileBuffer = fs.readFileSync(fullPath);
    const ext = path.extname(fullPath).toLowerCase().replace('.', '');
    const mimeType = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;

    return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
  } catch {
    return null;
  }
}

export async function generarCarteleraPNG(datosCalculados) {
  const fontData = obtenerFuente();

  // Cálculo de altura dinámica para evitar solapamiento
  const totalTarjetas = datosCalculados.tarjetas_paises?.length || 0;
  const filas = Math.ceil(totalTarjetas / 2);
  const calculatedHeight = 260 + (filas * 170); // Header + Padding + (Filas * Alto Fila)
  const finalHeight = Math.max(800, calculatedHeight);

  // Generación SVG vectorial con Satori
  const svg = await satori(
    renderCarteleraTemplate(datosCalculados),
    {
      width: 1080,
      height: finalHeight,
      fonts: [
        {
          name: 'Inter',
          data: fontData,
          weight: 700,
          style: 'normal',
        },
      ],
    }
  );

  // Rasterización a PNG
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: 1080,
    },
  });

  return resvg.render().asPng();
}
