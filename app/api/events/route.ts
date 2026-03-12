import { NextRequest, NextResponse } from 'next/server';
import { deviceStore } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Long Polling: Esperamos hasta que haya un cambio o pase un tiempo límite (timeout)
  // Esto es mucho más compatible con Cloudflare Tunel que SSE
  
  const timeout = 25000; // 25 segundos para evitar que Cloudflare corte por inactividad
  const startTime = Date.now();

  try {
    const data = await new Promise<any[]>((resolve) => {
      // 1. Si ya han pasado menos de 2 segundos desde el inicio, devolvemos el estado actual inmediatamente
      // Esto sirve para la carga inicial y actualizaciones rápidas
      
      // Suscribimos un callback que resolverá la promesa cuando el store cambie
      const unsubscribe = deviceStore.subscribe((newData) => {
        unsubscribe();
        clearTimeout(timer);
        resolve(newData);
      });

      // 2. Si no hay cambios en 25s, devolvemos el estado actual por timeout
      const timer = setTimeout(() => {
        unsubscribe();
        resolve(deviceStore.getDevices());
      }, timeout);
    });

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
