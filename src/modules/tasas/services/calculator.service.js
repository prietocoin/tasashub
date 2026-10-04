import { normalizarNumero, aplicarReglaPrecisionTasa } from '../../../utils/formatters.js';

const BANDERAS_MAP = {
  COP: '🇨🇴', PEN: '🇵🇪', ARS: '🇦🇷', BRL: '🇧🇷', MXN: '🇲🇽', EUR: '🇪🇺',
  USD: '🇺🇸', USDT: '₮', PYG: '🇵🇾', VES: '🇻🇪', CLP: '🇨🇱', DOP: '🇩🇴',
  CRC: '🇨🇷', BOB: '🇧🇴', ECU: '🇪🇨', PAN: '🇵🇦', CAD: '🇨🇦'
};

const NOMBRES_PAIS = {
  COP: 'Colombia', PEN: 'Peru', ARS: 'Argentina', BRL: 'Brazil',
  MXN: 'Mexico', EUR: 'Europa', USD: 'EEUU-Zelle', USDT: 'Tether',
  PYG: 'Paraguay', VES: 'Venezuela', CLP: 'Chile', DOP: 'Dominicana',
  CRC: 'Costa Rica', BOB: 'Bolivia', ECU: 'Ecuador', PAN: 'Panama', CAD: 'Canada'
};

export function calcularTasasCartelera(perfil, loteTasa) {
  const { nombre, id_grupo, moneda_base, monedas = {} } = perfil;
  const mapaTasas = loteTasa.tasas || {};
  const tarjetasPaises = [];

  for (const [code, config] of Object.entries(monedas)) {
    if (!config || !config.activo) continue;

    const codeUpper = code.toUpperCase();
    const tasaBaseRaw = mapaTasas[codeUpper];

    if (tasaBaseRaw === undefined && !['USD', 'USDT'].includes(codeUpper)) continue;

    const tasaBase = normalizarNumero(tasaBaseRaw || 1.0);
    if (tasaBase === 0) continue;

    // Regla acordada: Math.abs() para la cartelera
    // Depósito (Compra) siempre suma |%|, Pago (Venta) siempre resta |%|
    const pctDeposito = Math.abs(normalizarNumero(config.porcentaje?.deposito || 0));
    const pctPago = Math.abs(normalizarNumero(config.porcentaje?.pago || 0));

    const rawCompra = tasaBase * (1 + pctDeposito / 100);
    const rawVenta = tasaBase * (1 - pctPago / 100);

    tarjetasPaises.push({
      code: codeUpper,
      nombre_pais: NOMBRES_PAIS[codeUpper] || codeUpper,
      bandera: BANDERAS_MAP[codeUpper] || '🏳️',
      compra: aplicarReglaPrecisionTasa(rawCompra),
      venta: aplicarReglaPrecisionTasa(rawVenta),
    });
  }

  return {
    nombre_socio: nombre,
    id_grupo,
    moneda_base: moneda_base || 'USDT',
    lote_tasa: loteTasa.id_tasa || 'T000',
    hora_actualizacion: new Date().toLocaleTimeString('es-VE', {
      timeZone: 'America/Caracas',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }),
    tarjetas_paises: tarjetasPaises
  };
}
