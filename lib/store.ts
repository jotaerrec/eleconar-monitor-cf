
type DeviceData = {
  deviceId: string;
  value: number;
  status: string;
  lastUpdate: number;
};

class DeviceStore {
  private devices: Map<string, DeviceData> = new Map();
  private subscribers: Set<(data: DeviceData[]) => void> = new Set();

  updateDevice(data: Omit<DeviceData, 'lastUpdate'>) {
    const updatedData = { ...data, lastUpdate: Date.now() };
    this.devices.set(data.deviceId, updatedData);
    console.log(`[Store] Actualizado ${data.deviceId}:`, updatedData);
    this.notifySubscribers();
  }

  getDevices(): DeviceData[] {
    return Array.from(this.devices.values());
  }

  subscribe(callback: (data: DeviceData[]) => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers() {
    const currentData = this.getDevices();
    this.subscribers.forEach((callback) => {
      try {
        callback(currentData);
      } catch (err) {
        console.error('[Store] Error notificando suscriptor:', err);
      }
    });
  }
}

// Singleton global para evitar reinicios en dev
const globalForStore = global as unknown as { deviceStore: DeviceStore };
export const deviceStore = globalForStore.deviceStore || new DeviceStore();
if (process.env.NODE_ENV !== 'production') globalForStore.deviceStore = deviceStore;
