import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import fs from 'fs';
import path from 'path';
import { renderCarteleraTemplate } from '../templates/cartelera.template.js';

let fontBuffer = null;
const assetsCache = {
  logo: null,
  background: null,
  flags: {},
};

// Precarga de fuente
function obtenerFuente() {
  if (!fontBuffer) {
    const fontPath = path.join(process.cwd(), 'assets/fonts/Inter-Bold.ttf');
    if (fs.existsSync(fontPath)) fontBuffer = fs.readFileSync(fontPath);
  }
  return fontBuffer;
}

// Helper para convertir archivos a Data URI Base64
function fileToBase64(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase().replace('.', '');
  const mimeType = ext === 'svg' ? 'image/svg+xml' : `image/${ext === 'jpg' ? 'jpeg' : ext}`;
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

// Cargar recurso individual (Logo o Fondo) con Cache
export function obtenerAssetBase64(nombre) {
  if (!assetsCache[nombre]) {
    const filePng = path.join(process.cwd(), `assets/${nombre}.png`);
    const fileSvg = path.join(process.cwd(), `assets/${nombre}.svg`);
    assetsCache[nombre] = fileToBase64(filePng) || fileToBase64(fileSvg);
  }
  return assetsCache[nombre];
}

// Cargar Bandera con Cache
export function obtenerBanderaBase64(code) {
  const codeLower = code.toLowerCase();
  if (!assetsCache.flags[codeLower]) {
    const flagPng = path.join(process.cwd(), `assets/flags/${codeLower}.png`);
    const flagSvg = path.join(process.cwd(), `assets/flags/${codeLower}.svg`);
    assetsCache.flags[codeLower] = fileToBase64(flagPng) || fileToBase64(flagSvg);
  }
  return assetsCache.flags[codeLower];
}

export async function generarCarteleraPNG(datosCalculados) {
  const fontData = obtenerFuente();

  const totalTarjetas = datosCalculados.tarjetas_paises?.length || 0;
  const filas = Math.ceil(totalTarjetas / 2);
  const calculatedHeight = 260 + filas * 170;
  const finalHeight = Math.max(800, calculatedHeight);

  const svg = await satori(renderCarteleraTemplate(datosCalculados), {
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
  });

  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: 1080,
    },
  });

  return resvg.render().asPng();
}
