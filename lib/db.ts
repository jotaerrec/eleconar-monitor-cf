import { Pool, type PoolClient, type QueryResultRow } from "pg";

declare global {
	var __monelcPool: Pool | undefined;
	var __monelcSchemaReady: Promise<void> | undefined;
}

function getDatabaseUrl() {
	const url = process.env.DATABASE_URL;
	if (!url) {
		throw new Error("Missing DATABASE_URL environment variable");
	}
	return url;
}

export function getPool() {
	if (!global.__monelcPool) {
		global.__monelcPool = new Pool({
			connectionString: getDatabaseUrl(),
		});
	}

	return global.__monelcPool;
}

export async function sql<T extends QueryResultRow>(query: string, values: unknown[] = []) {
	await ensureSchema();
	return getPool().query<T>(query, values);
}

export async function withClient<T>(callback: (client: PoolClient) => Promise<T>) {
	await ensureSchema();
	const client = await getPool().connect();
	try {
		return await callback(client);
	} finally {
		client.release();
	}
}

async function ensureSchema() {
	if (!global.__monelcSchemaReady) {
		global.__monelcSchemaReady = createSchema();
	}

	return global.__monelcSchemaReady;
}

async function createSchema() {
	const pool = getPool();
	await pool.query(`
		CREATE TABLE IF NOT EXISTS companies (
			id SERIAL PRIMARY KEY,
			slug TEXT NOT NULL UNIQUE,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);

		CREATE TABLE IF NOT EXISTS users (
			id SERIAL PRIMARY KEY,
			email TEXT NOT NULL UNIQUE,
			display_name TEXT,
			password_hash TEXT NOT NULL,
			password_salt TEXT NOT NULL,
			password_iterations INTEGER NOT NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);

		CREATE TABLE IF NOT EXISTS user_companies (
			user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			PRIMARY KEY (user_id, company_id)
		);

		CREATE TABLE IF NOT EXISTS devices (
			company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
			device_id TEXT NOT NULL,
			value DOUBLE PRECISION NOT NULL DEFAULT 0,
			status TEXT NOT NULL DEFAULT 'unknown',
			last_update TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			PRIMARY KEY (company_id, device_id)
		);

		CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
		CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
		CREATE INDEX IF NOT EXISTS idx_user_companies_user_id ON user_companies(user_id);
		CREATE INDEX IF NOT EXISTS idx_devices_company_last_update ON devices(company_id, last_update DESC);
	`);
}
