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

// Mapa de conversión: Código de Divisa -> Nombre de Archivo en assets/flags/
const MAPA_BANDERAS_ISO = {
  ARS: 'ar',
  BRL: 'br',
  CLP: 'cl',
  COP: 'co',
  MXN: 'mx',
  PEN: 'pe',
  PYG: 'py',
  VES: 've',
  USD: 'us',
  USDT: 'us',
  BOB: 'bo',
  EUR: 'eu',
  ECU: 'ec',
  PAN: 'pa',
};

function obtenerFuente() {
  if (!fontBuffer) {
    const fontPath = path.join(process.cwd(), 'assets/fonts/Inter-Bold.ttf');
    if (fs.existsSync(fontPath)) fontBuffer = fs.readFileSync(fontPath);
  }
  return fontBuffer;
}

function fileToBase64(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase().replace('.', '');
  const mimeType = ext === 'svg' ? 'image/svg+xml' : `image/${ext === 'jpg' ? 'jpeg' : ext}`;
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

export function obtenerAssetBase64(nombre) {
  if (!assetsCache[nombre]) {
    const filePng = path.join(process.cwd(), `assets/${nombre}.png`);
    const fileSvg = path.join(process.cwd(), `assets/${nombre}.svg`);
    assetsCache[nombre] = fileToBase64(filePng) || fileToBase64(fileSvg);
  }
  return assetsCache[nombre];
}

export function obtenerBanderaBase64(code) {
  if (!code) return null;
  const codeUpper = code.toUpperCase();
  const filename = MAPA_BANDERAS_ISO[codeUpper] || code.toLowerCase().substring(0, 2);

  if (!assetsCache.flags[filename]) {
    const flagPng = path.join(process.cwd(), `assets/flags/${filename}.png`);
    const flagSvg = path.join(process.cwd(), `assets/flags/${filename}.svg`);
    assetsCache.flags[filename] = fileToBase64(flagPng) || fileToBase64(flagSvg);
  }
  return assetsCache.flags[filename];
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
