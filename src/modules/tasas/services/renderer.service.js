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

export async function generarCarteleraPNG(datosCalculados) {
  const fontData = obtenerFuente();

  // 1. Satori convierte la plantilla JSX en un SVG vectorial en memoria
  const svg = await satori(
    renderCarteleraTemplate(datosCalculados),
    {
      width: 1080,
      height: 800,
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

  // 2. Resvg rasteriza el SVG a un Buffer PNG a 1080px
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: 1080,
    },
  });

  return resvg.render().asPng();
}
