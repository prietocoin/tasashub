import { normalizarNumero, aplicarReglaPrecisionTasa } from '../../../utils/formatters.js';

const BANDERAS_MAP = {
  COP: 'co', PEN: 'pe', ARS: 'ar', BRL: 'br', MXN: 'mx', EUR: 'eu',
  USD: 'us', USDT: 'us', PYG: 'py', VES: 've', CLP: 'cl', DOP: 'do',
  CRC: 'cr', BOB: 'bo', ECU: 'ec', PAN: 'pa', CAD: 'ca'
};

const NOMBRES_PAIS = {
  COP: 'Colombia', PEN: 'Peru', ARS: 'Argentina', BRL: 'Brazil',
  MXN: 'Mexico', EUR: 'Europa', USD: 'EEUU-Zelle', USDT: 'Tether',
  PYG: 'Paraguay', VES: 'Venezuela', CLP: 'Chile', DOP: 'Dominicana',
  CRC: 'Costa Rica', BOB: 'Bolivia', ECU: 'Ecuador', PAN: 'Panama', CAD: 'Canada'
};

export function calcularTasasCartelera(perfil, loteActual, loteAnterior = null) {
  const { nombre, id_grupo, moneda_base, monedas = {} } = perfil;
  const mapaTasasActuales = loteActual.tasas || {};
  const mapaTasasAnteriores = loteAnterior?.tasas || {};
  const tarjetasPaises = [];

  for (const [code, config] of Object.entries(monedas)) {
    if (!config || !config.activo) continue;

    const codeUpper = code.toUpperCase();
    const tasaBaseRaw = mapaTasasActuales[codeUpper];

    if (tasaBaseRaw === undefined && !['USD', 'USDT'].includes(codeUpper)) continue;

    const tasaBase = normalizarNumero(tasaBaseRaw || 1.0);
    if (tasaBase === 0) continue;

    // Calcular Tendencia respecto al Lote Anterior
    const tasaAnteriorRaw = mapaTasasAnteriores[codeUpper];
    let trend = 'equal'; // 'up', 'down', 'equal'
    
    if (tasaAnteriorRaw !== undefined) {
      const tasaAnterior = normalizarNumero(tasaAnteriorRaw);
      if (tasaBase > tasaAnterior) trend = 'up';
      else if (tasaBase < tasaAnterior) trend = 'down';
    }

    const pctDeposito = Math.abs(normalizarNumero(config.porcentaje?.deposito || 0));
    const pctPago = Math.abs(normalizarNumero(config.porcentaje?.pago || 0));

    const rawCompra = tasaBase * (1 + pctDeposito / 100);
    const rawVenta = tasaBase * (1 - pctPago / 100);

    tarjetasPaises.push({
      code: codeUpper,
      nombre_pais: NOMBRES_PAIS[codeUpper] || codeUpper,
      bandera: BANDERAS_MAP[codeUpper] || 'us',
      compra: aplicarReglaPrecisionTasa(rawCompra),
      venta: aplicarReglaPrecisionTasa(rawVenta),
      trend, // Indicador de tendencia
    });
  }

  const ahoraVE = new Date();
  const fechaCorta = ahoraVE.toLocaleDateString('es-VE', {
    timeZone: 'America/Caracas',
    day: '2-digit',
    month: 'short'
  }).replace('.', '');

  const horaVE = ahoraVE.toLocaleTimeString('es-VE', {
    timeZone: 'America/Caracas',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  return {
    nombre_socio: nombre,
    id_grupo,
    moneda_base: moneda_base || 'USDT',
    lote_tasa: loteActual.id_tasa || 'T000',
    fecha_actualizacion: fechaCorta,
    hora_actualizacion: horaVE,
    tarjetas_paises: tarjetasPaises
  };
}
