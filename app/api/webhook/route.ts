import { NextRequest, NextResponse } from 'next/server';
import { deviceStore } from '@/lib/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { deviceId, value, status } = body;

    if (!deviceId) {
      return NextResponse.json({ error: 'Missing deviceId' }, { status: 400 });
    }

    deviceStore.updateDevice({
      deviceId,
      value: typeof value === 'number' ? value : 0,
      status: status || 'unknown',
    });

    console.log(`[Webhook] Datos recibidos de ${deviceId}: ${value}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }
}
