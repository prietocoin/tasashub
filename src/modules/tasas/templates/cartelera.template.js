// Helper nativo para VNodes de Satori
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

  return h(
    'div',
    {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#040a17',
        padding: '40px',
        color: '#ffffff',
        fontFamily: 'Inter',
        boxSizing: 'border-box',
      },
    },
    // Header
    h(
      'div',
      {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
        },
      },
      h(
        'div',
        { style: { display: 'flex', alignItems: 'center', fontSize: '38px', fontWeight: 'bold' } },
        h('span', {}, 'FUNDABLOCK'),
        h('span', { style: { color: '#3b82f6', margin: '0 15px' } }, '|'),
        h('span', { style: { color: '#e2e8f0' } }, nombre_socio)
      ),
      h(
        'div',
        { style: { display: 'flex', fontSize: '32px', fontWeight: '900', color: '#60a5fa' } },
        'FB'
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
      tarjetas_paises.map((item) =>
        h(
          'div',
          {
            key: item.code,
            style: {
              width: '48%',
              height: '160px',
              backgroundColor: '#0f172a',
              border: '1.5px solid #1e3a8a',
              borderTop: '4px solid #3b82f6',
              borderRadius: '16px',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxSizing: 'border-box',
            },
          },
          // Nombre + Badge País
          h(
            'div',
            { style: { display: 'flex', alignItems: 'center', gap: '12px' } },
            h(
              'div',
              {
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#1e3a8a',
                  color: '#60a5fa',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  border: '1px solid #2563eb',
                },
              },
              item.code.substring(0, 2)
            ),
            h('span', { style: { fontSize: '26px', fontWeight: 'bold', color: '#ffffff' } }, item.nombre_pais)
          ),
          // Tasas
          h(
            'div',
            {
              style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid #1e3a8a',
                paddingTop: '10px',
              },
            },
            h(
              'div',
              { style: { display: 'flex', flexDirection: 'column' } },
              h('span', { style: { fontSize: '14px', color: '#94a3b8', textTransform: 'uppercase' } }, 'Comprar'),
              h('span', { style: { fontSize: '32px', fontWeight: 'bold', color: '#34d399' } }, String(item.compra))
            ),
            h('div', { style: { display: 'flex', width: '1px', height: '40px', backgroundColor: '#1e3a8a' } }),
            h(
              'div',
              { style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' } },
              h('span', { style: { fontSize: '14px', color: '#94a3b8', textTransform: 'uppercase' } }, 'Vender'),
              h('span', { style: { fontSize: '32px', fontWeight: 'bold', color: '#fb7185' } }, String(item.venta))
            )
          )
        )
      )
    ),
    // Footer
    h(
      'div',
      {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '20px',
          paddingTop: '10px',
          fontSize: '18px',
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
            padding: '6px 16px',
            borderRadius: '20px',
            color: '#ffffff',
          },
        },
        `Actualizado: ${hora_actualizacion}`
      )
    )
  );
}
