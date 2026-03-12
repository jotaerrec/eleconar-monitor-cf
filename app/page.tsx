'use client';

import { useEffect, useState, useRef } from 'react';

type DeviceData = {
  deviceId: string;
  value: number;
  status: string;
  lastUpdate: number;
};

export default function Dashboard() {
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [now, setNow] = useState(Date.now());
  const isMounted = useRef(true);

  // Timer para refrescar el estado visual de los dispositivos cada segundo
  useEffect(() => {
    isMounted.current = true;
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => {
      isMounted.current = false;
      clearInterval(timer);
    };
  }, []);

  // Long Polling para recibir datos en tiempo real
  useEffect(() => {
    async function poll() {
      if (!isMounted.current) return;
      
      try {
        const res = await fetch(`/api/events?t=${Date.now()}`);
        if (!res.ok) throw new Error('Network error');
        
        const data = await res.json();
        if (isMounted.current) {
          setDevices(data);
          setIsConnected(true);
        }
        
        // Llamada inmediata para esperar el próximo cambio
        poll();
      } catch (err) {
        console.error('Polling error:', err);
        if (isMounted.current) {
          setIsConnected(false);
          // Reintento tras un breve delay si hay error
          setTimeout(poll, 3000);
        }
      }
    }

    poll();
  }, []);

  const getStatus = (lastUpdate: number) => {
    // Si no hay señal por más de 7 segundos, marcar como desconectado
    const diff = now - lastUpdate;
    return diff < 15000;
  };

  return (<>
    <main className="dashboard-container">
      <nav className='navbar-container' style={{display : "flex", justifyContent:"space-between", margin:"20px", alignItems:"center", backgroundColor:"transparent"}}>
            <img src="/fonsecasa.png" alt="Fonseca SA" height={"60px"} style={{marginInline: "4px"}} />
            <h1>Monitor De Estado De Maquinas</h1>
            <img src="/eleconar.png" alt="Fonseca SA" height={"40px"} style={{marginInline: "4px"}} />
      </nav>
      <div className="header">
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem' }}>
          <p style={{ opacity: 0.6 }}>
            {isConnected ? (
              <span style={{ color: '#10b981' }}>● Conectado (Tiempo Real)</span>
            ) : (
              <span style={{ color: '#ef4444' }}>○ Reconectando...</span>
            )}
          </p>
        </div>
        <p>Hora: {new Date().toLocaleTimeString()}</p>
      </div>

      <div className="device-grid">
        {devices.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
            <p>Esperando datos de dispositivos...</p>
            <p style={{ fontSize: '0.8rem', marginTop: '1rem' }}>
              Usa el webhook <code>/api/webhook</code> para enviar información.
            </p>
          </div>
        ) : (
          devices.map((device) => {
            const isOnline = getStatus(device.lastUpdate);
            return (
              <div key={device.deviceId} className="device-card">
                <div className="device-status">
                  <span className="device-id">{device.deviceId}</span>
                  <span className={`status-badge ${isOnline ? 'status-online' : 'status-offline'}`}>
                    {isOnline ? 'En línea' : 'Desconectado'}
                  </span>
                </div>
                
                <div className="device-value">
                  {device.value.toLocaleString()}
                  <span className="value-unit">Velocidad </span>
                  {device.deviceId.startsWith("Fraccionadora") && <>{ (device.value / 38).toFixed(2) }
                  <span className="value-unit">Rollos Min</span></>}
                </div>

                  <span className={`status-badge ${isOnline ? 'status-online' : 'status-offline'}`}>
                    {isOnline ? 'Maquina en marcha' : 'Maquina Parada'}
                  </span>
                <div className="last-update">
                  {isOnline && <span className="live-indicator"></span>}
                  Última vez: {new Date(device.lastUpdate).toLocaleTimeString()}
                </div>

                
              </div>
            );
          })
        )}
      </div>
    </main></>
  );
}
