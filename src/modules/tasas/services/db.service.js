import pool from '../../../config/db.js';

export async function obtenerUltimoLoteTasas() {
  const query = `
    SELECT id_tasa, tasas, created_at 
    FROM tasas_glaukov 
    ORDER BY created_at DESC 
    LIMIT 1;
  `;
  const { rows } = await pool.query(query);
  if (rows.length === 0) {
    throw new Error('No se encontraron lotes de tasas en la tabla tasas_glaukov.');
  }
  return rows[0];
}

export async function obtenerPerfilSocio(nombreSocio) {
  const query = `
    SELECT * 
    FROM perfiles_glaukov 
    WHERE LOWER(nombre) = LOWER($1) 
    LIMIT 1;
  `;
  const { rows } = await pool.query(query, [nombreSocio.trim()]);
  if (rows.length === 0) {
    throw new Error(`Socio "${nombreSocio}" no encontrado en perfiles_glaukov.`);
  }
  return rows[0];
}
