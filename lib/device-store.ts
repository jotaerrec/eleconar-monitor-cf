import { sql } from "@/lib/db";
import type { DeviceData, DeviceUpdate } from "@/lib/devices";

const LONG_POLL_TIMEOUT_MS = 25_000;
const POLL_INTERVAL_MS = 1_000;

type CompanyRow = {
	id: number;
	slug: string;
};

type DeviceRow = {
	device_id: string;
	last_update: Date;
	status: string;
	value: number;
};

type TimestampRow = {
	last_update: Date | null;
};

export async function upsertDevice(namecompany: string, input: DeviceUpdate) {
	const company = await ensureCompany(namecompany);
	await sql(
		`
			INSERT INTO devices (company_id, device_id, value, status, last_update)
			VALUES ($1, $2, $3, $4, NOW())
			ON CONFLICT (company_id, device_id)
			DO UPDATE SET
				value = EXCLUDED.value,
				status = EXCLUDED.status,
				last_update = EXCLUDED.last_update
		`,
		[company.id, input.deviceId, input.value, input.status],
	);
}

export async function getCompanyDevices(namecompany: string): Promise<DeviceData[]> {
	const company = await findCompany(namecompany);
	if (!company) return [];
	return listDevices(company.id);
}

export async function waitForCompanyDevices(namecompany: string, since: number | null, timeoutMs: number = LONG_POLL_TIMEOUT_MS) {
	const company = await findCompany(namecompany);
	if (!company) return [];

	const initialLatest = since ?? (await getLatestUpdate(company.id));
	const deadline = Date.now() + timeoutMs;

	while (Date.now() < deadline) {
		const latest = await getLatestUpdate(company.id);
		if (latest > initialLatest) {
			return listDevices(company.id);
		}
		await sleep(POLL_INTERVAL_MS);
	}

	return listDevices(company.id);
}

export async function ensureCompany(namecompany: string) {
	const inserted = await sql<CompanyRow>(
		`
			INSERT INTO companies (slug)
			VALUES ($1)
			ON CONFLICT (slug) DO NOTHING
			RETURNING id, slug
		`,
		[namecompany],
	);
	if (inserted.rows[0]) return inserted.rows[0];

	const existing = await sql<CompanyRow>("SELECT id, slug FROM companies WHERE slug = $1 LIMIT 1", [namecompany]);
	if (!existing.rows[0]) {
		throw new Error(`Could not resolve company ${namecompany}`);
	}
	return existing.rows[0];
}

async function findCompany(namecompany: string) {
	const result = await sql<CompanyRow>("SELECT id, slug FROM companies WHERE slug = $1 LIMIT 1", [namecompany]);
	return result.rows[0] ?? null;
}

async function listDevices(companyId: number): Promise<DeviceData[]> {
	const result = await sql<DeviceRow>(
		`
			SELECT device_id, value, status, last_update
			FROM devices
			WHERE company_id = $1
			ORDER BY device_id ASC
		`,
		[companyId],
	);

	return result.rows.map((row) => ({
		deviceId: row.device_id,
		value: Number(row.value),
		status: row.status,
		lastUpdate: row.last_update.getTime(),
	}));
}

async function getLatestUpdate(companyId: number) {
	const result = await sql<TimestampRow>("SELECT MAX(last_update) AS last_update FROM devices WHERE company_id = $1", [companyId]);
	return result.rows[0]?.last_update?.getTime() ?? 0;
}

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
