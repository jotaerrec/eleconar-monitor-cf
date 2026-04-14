import { DurableObject } from "cloudflare:workers";

export type DeviceData = {
	deviceId: string;
	value: number;
	status: string;
	lastUpdate: number;
};

export type DeviceUpdate = {
	deviceId: string;
	value: number;
	status: string;
};

const LONG_POLL_TIMEOUT_MS = 25_000;

export class CompanyStore extends DurableObject {
	private devices = new Map<string, DeviceData>();
	private waiters = new Set<(data: DeviceData[]) => void>();

	async update(input: DeviceUpdate): Promise<void> {
		this.devices.set(input.deviceId, {
			deviceId: input.deviceId,
			value: input.value,
			status: input.status,
			lastUpdate: Date.now(),
		});
		this.notify();
	}

	async snapshot(): Promise<DeviceData[]> {
		return this.list();
	}

	async wait(timeoutMs: number = LONG_POLL_TIMEOUT_MS): Promise<DeviceData[]> {
		return new Promise<DeviceData[]>((resolve) => {
			const waiter = (data: DeviceData[]) => {
				clearTimeout(timer);
				this.waiters.delete(waiter);
				resolve(data);
			};
			const timer = setTimeout(() => {
				this.waiters.delete(waiter);
				resolve(this.list());
			}, timeoutMs);
			this.waiters.add(waiter);
		});
	}

	private list(): DeviceData[] {
		return Array.from(this.devices.values());
	}

	private notify() {
		const data = this.list();
		const current = Array.from(this.waiters);
		this.waiters.clear();
		for (const waiter of current) {
			try {
				waiter(data);
			} catch (err) {
				console.error("[CompanyStore] Error notificando waiter:", err);
			}
		}
	}
}
