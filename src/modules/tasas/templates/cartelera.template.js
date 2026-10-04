import React from 'react';

export function renderCarteleraTemplate(data) {
  const { nombre_socio, tarjetas_paises = [], hora_actualizacion } = data;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#040a17',
        padding: '40px',
        color: '#ffffff',
        fontFamily: 'Inter',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', fontSize: '38px', fontWeight: 'bold' }}>
          <span>FUNDABLOCK</span>
          <span style={{ color: '#3b82f6', margin: '0 15px' }}>|</span>
          <span style={{ color: '#e2e8f0' }}>{nombre_socio}</span>
        </div>
        <div style={{ fontSize: '32px', fontWeight: '900', color: '#60a5fa' }}>
          FB
        </div>
      </div>

      {/* Grid de Paises */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '20px',
          justifyContent: 'space-between',
          flex: 1,
        }}
      >
        {tarjetas_paises.map((item, index) => (
          <div
            key={index}
            style={{
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
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '32px' }}>{item.bandera}</span>
              <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#ffffff' }}>
                {item.nombre_pais}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid #1e3a8a',
                paddingTop: '10px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '14px', color: '#94a3b8', textTransform: 'uppercase' }}>
                  Comprar
                </span>
                <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#34d399' }}>
                  {item.compra}
                </span>
              </div>
              <div style={{ width: '1px', height: '40px', backgroundColor: '#1e3a8a' }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '14px', color: '#94a3b8', textTransform: 'uppercase' }}>
                  Vender
                </span>
                <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#fb7185' }}>
                  {item.venta}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '20px',
          paddingTop: '10px',
          fontSize: '18px',
          color: '#94a3b8',
        }}
      >
        <span>TasasHub Engine • Fundablock</span>
        <span
          style={{
            backgroundColor: '#0f172a',
            border: '1px solid #1d4ed8',
            padding: '6px 16px',
            borderRadius: '20px',
            color: '#ffffff',
          }}
        >
          Actualizado: {hora_actualizacion}
        </span>
      </div>
    </div>
  );
}
