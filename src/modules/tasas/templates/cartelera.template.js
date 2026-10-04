import { obtenerAssetBase64, obtenerBanderaBase64 } from '../services/renderer.service.js';

const h = (type, props = {}, ...children) => {
  const flatChildren = children.flat(Infinity).filter((c) => c !== null && c !== undefined && c !== false);
  return {
    type,
    props: {
      ...props,
      style: {
        ...(type === 'div' ? { display: 'flex' } : {}),
        ...(props.style || {}),
      },
      children: flatChildren.length === 1 ? flatChildren[0] : flatChildren,
    },
  };
};

export function renderCarteleraTemplate(data) {
  const { nombre_socio, tarjetas_paises = [], hora_actualizacion } = data;

  const bgImageSrc = obtenerAssetBase64('bg-template');
  const logoSrc = obtenerAssetBase64('logo'); // Carga assets/logo.png (Búho)

  return h(
    'div',
    {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#040a17',
        backgroundImage: bgImageSrc
          ? `url(${bgImageSrc})`
          : 'radial-gradient(circle at 15% 10%, rgba(217, 119, 6, 0.15) 0%, transparent 35%), radial-gradient(circle at 85% 20%, rgba(30, 58, 138, 0.25) 0%, transparent 40%), radial-gradient(circle at 50% 90%, rgba(15, 23, 42, 0.8) 0%, transparent 100%)',
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        padding: '40px',
        color: '#ffffff',
        fontFamily: 'Inter',
        boxSizing: 'border-box',
      },
    },
    // Header con Logo del Búho
    h(
      'div',
      {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '25px',
        },
      },
      h(
        'div',
        { style: { display: 'flex', alignItems: 'center', gap: '15px' } },
        logoSrc
          ? h('img', {
              src: logoSrc,
              height: 65,
              style: { objectFit: 'contain' },
            })
          : null,
        h(
          'div',
          { style: { display: 'flex', alignItems: 'center', fontSize: '36px', fontWeight: 'bold' } },
          h('span', { style: { color: '#ffffff', letterSpacing: '1px' } }, 'FUNDABLOCK'),
          h('span', { style: { color: '#d97706', margin: '0 12px' } }, '|'),
          h('span', { style: { color: '#94a3b8', fontWeight: 'normal' } }, nombre_socio)
        )
      ),
      h(
        'div',
        {
          style: {
            display: 'flex',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#fbbf24',
            backgroundColor: 'rgba(217, 119, 6, 0.1)',
            border: '1px solid rgba(217, 119, 6, 0.3)',
            padding: '6px 16px',
            borderRadius: '20px',
            letterSpacing: '1px',
          },
        },
        'OFICIAL'
      )
    ),
    // Grid de Países
    h(
      'div',
      {
        style: {
          display: 'flex',
          flexWrap: 'wrap',
          gap: '20px',
          justifyContent: 'space-between',
          flex: 1,
        },
      },
      tarjetas_paises.map((item) => {
        const flagSrc = obtenerBanderaBase64(item.code);

        return h(
          'div',
          {
            key: item.code,
            style: {
              width: '48%',
              height: '150px',
              backgroundColor: '#0f172a',
              border: '1.5px solid #1e3a8a',
              borderTop: '4px solid #3b82f6',
              borderRadius: '16px',
              padding: '14px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxSizing: 'border-box',
            },
          },
          // Header Tarjeta (Bandera + Nombre)
          h(
            'div',
            { style: { display: 'flex', alignItems: 'center', gap: '12px' } },
            flagSrc
              ? h('img', {
                  src: flagSrc,
                  width: 36,
                  height: 26,
                  style: { borderRadius: '4px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.2)' },
                })
              : h(
                  'div',
                  {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#1e3a8a',
                      color: '#60a5fa',
                      fontWeight: 'bold',
                      fontSize: '15px',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: '1px solid #2563eb',
                    },
                  },
                  item.code.substring(0, 2)
                ),
            h('span', { style: { fontSize: '24px', fontWeight: 'bold', color: '#ffffff' } }, item.nombre_pais)
          ),
          // Tasas Comprar / Vender
          h(
            'div',
            {
              style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid #1e3a8a',
                paddingTop: '8px',
              },
            },
            h(
              'div',
              { style: { display: 'flex', flexDirection: 'column' } },
              h('span', { style: { fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' } }, 'Comprar'),
              h('span', { style: { fontSize: '28px', fontWeight: 'bold', color: '#34d399' } }, String(item.compra))
            ),
            h('div', { style: { display: 'flex', width: '1px', height: '35px', backgroundColor: '#1e3a8a' } }),
            h(
              'div',
              { style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' } },
              h('span', { style: { fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' } }, 'Vender'),
              h('span', { style: { fontSize: '28px', fontWeight: 'bold', color: '#fb7185' } }, String(item.venta))
            )
          )
        );
      })
    ),
    // Footer
    h(
      'div',
      {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '25px',
          paddingTop: '10px',
          fontSize: '16px',
          color: '#94a3b8',
        },
      },
      h('span', {}, 'TasasHub Engine • Fundablock'),
      h(
        'span',
        {
          style: {
            backgroundColor: '#0f172a',
            border: '1px solid #1d4ed8',
            padding: '4px 14px',
            borderRadius: '20px',
            color: '#ffffff',
          },
        },
        `Actualizado: ${hora_actualizacion}`
      )
    )
  );
}
