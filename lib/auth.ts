import { cookies } from "next/headers";
import { normalizeCompanySlug } from "@/lib/company";
import { ensureCompany } from "@/lib/device-store";
import { sql, withClient } from "@/lib/db";

const AUTH_COOKIE_NAME = "monelc_auth";
const AUTH_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export type PublicUserRecord = {
	companies: string[];
	displayName: string | null;
	email: string;
	id: number;
};

type StoredUserRecord = PublicUserRecord & {
	createdAt: number;
	passwordHash: string;
	passwordIterations: number;
	passwordSalt: string;
};

type AuthTokenPayload = {
	userId: number;
	email: string;
	exp: number;
};

type UserRow = {
	created_at: Date;
	display_name: string | null;
	email: string;
	id: number;
	password_hash: string;
	password_iterations: number;
	password_salt: string;
};

type CompanyRow = {
	slug: string;
};

export async function getAuthStore() {
	return {
		createUser,
		getPublicUserById,
		getUserByEmail,
	};
}

export async function getAuthSecret(): Promise<string> {
	if (!process.env.AUTH_SECRET) {
		throw new Error("Missing AUTH_SECRET environment variable");
	}
	return process.env.AUTH_SECRET;
}

export async function createAuthToken(user: Pick<PublicUserRecord, "id" | "email">): Promise<string> {
	const payload: AuthTokenPayload = {
		userId: user.id,
		email: user.email,
		exp: Date.now() + AUTH_TTL_MS,
	};

	const secret = await getAuthSecret();
	const encodedPayload = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
	const signature = await sign(encodedPayload, secret);
	return `${encodedPayload}.${signature}`;
}

export async function verifyAuthToken(token: string): Promise<AuthTokenPayload | null> {
	const [encodedPayload, signature] = token.split(".");
	if (!encodedPayload || !signature) return null;

	const secret = await getAuthSecret();
	const expectedSignature = await sign(encodedPayload, secret);
	if (!timingSafeEqual(signature, expectedSignature)) return null;

	try {
		const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(encodedPayload))) as AuthTokenPayload;
		if (!payload || typeof payload.userId !== "number" || typeof payload.email !== "string" || typeof payload.exp !== "number") {
			return null;
		}
		if (payload.exp <= Date.now()) return null;
		return payload;
	} catch {
		return null;
	}
}

export async function getCurrentUser(): Promise<PublicUserRecord | null> {
	const cookieStore = await cookies();
	const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
	if (!token) return null;

	const payload = await verifyAuthToken(token);
	if (!payload) return null;

	return getPublicUserById(payload.userId);
}

export async function userCanAccessCompany(namecompany: string, user: PublicUserRecord | null): Promise<boolean> {
	if (!user) return false;
	const slug = normalizeCompanySlug(namecompany);
	if (!slug) return false;
	return user.companies.includes(slug);
}

export function appendAuthCookie(response: Response, token: string) {
	response.headers.append(
		"Set-Cookie",
		serializeCookie(AUTH_COOKIE_NAME, token, {
			httpOnly: true,
			secure: shouldUseSecureCookies(),
			sameSite: "Lax",
			path: "/",
			maxAge: AUTH_TTL_MS / 1000,
		}),
	);
}

export function appendLogoutCookie(response: Response) {
	response.headers.append(
		"Set-Cookie",
		serializeCookie(AUTH_COOKIE_NAME, "", {
			httpOnly: true,
			secure: shouldUseSecureCookies(),
			sameSite: "Lax",
			path: "/",
			maxAge: 0,
		}),
	);
}

function serializeCookie(
	name: string,
	value: string,
	options: {
		httpOnly?: boolean;
		maxAge?: number;
		path?: string;
		sameSite?: "Lax" | "Strict" | "None";
		secure?: boolean;
	},
) {
	const parts = [`${name}=${value}`];
	if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
	parts.push(`Path=${options.path ?? "/"}`);
	if (options.httpOnly) parts.push("HttpOnly");
	if (options.secure) parts.push("Secure");
	if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
	return parts.join("; ");
}

async function sign(value: string, secret: string): Promise<string> {
	const key = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
	return base64UrlEncode(new Uint8Array(signature));
}

function base64UrlEncode(input: Uint8Array) {
	return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(input: string) {
	const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
	const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
	return new Uint8Array(Buffer.from(normalized + padding, "base64"));
}

function timingSafeEqual(a: string, b: string) {
	if (a.length !== b.length) return false;
	let result = 0;
	for (let i = 0; i < a.length; i += 1) {
		result |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}
	return result === 0;
}

function shouldUseSecureCookies() {
	if (process.env.AUTH_COOKIE_SECURE === "true") return true;
	if (process.env.AUTH_COOKIE_SECURE === "false") return false;
	return process.env.NODE_ENV === "production";
}

async function createUser(input: {
	companies: string[];
	displayName: string | null;
	email: string;
	passwordHash: string;
	passwordIterations: number;
	passwordSalt: string;
}): Promise<PublicUserRecord> {
	const email = normalizeEmail(input.email);
	const companies = uniqueCompanies(input.companies);
	if (!email) throw new Error("Email invalido");
	if (companies.length === 0) throw new Error("Debes vincular al menos una empresa");

	return withClient(async (client) => {
		await client.query("BEGIN");
		try {
			const existing = await client.query<UserRow>(
				`
					SELECT id, email, display_name, password_hash, password_salt, password_iterations, created_at
					FROM users
					WHERE email = $1
					LIMIT 1
				`,
				[email],
			);
			if (existing.rows[0]) {
				throw new Error("El email ya esta registrado");
			}

			const inserted = await client.query<UserRow>(
				`
					INSERT INTO users (email, display_name, password_hash, password_salt, password_iterations)
					VALUES ($1, $2, $3, $4, $5)
					RETURNING id, email, display_name, password_hash, password_salt, password_iterations, created_at
				`,
				[email, input.displayName?.trim() || null, input.passwordHash, input.passwordSalt, input.passwordIterations],
			);
			const user = inserted.rows[0];

			for (const company of companies) {
				const companyRecord = await ensureCompany(company);
				await client.query(
					`
						INSERT INTO user_companies (user_id, company_id)
						VALUES ($1, $2)
						ON CONFLICT (user_id, company_id) DO NOTHING
					`,
					[user.id, companyRecord.id],
				);
			}

			await client.query("COMMIT");
			return {
				id: user.id,
				email: user.email,
				displayName: user.display_name,
				companies,
			};
		} catch (error) {
			await client.query("ROLLBACK");
			throw error;
		}
	});
}

async function getUserByEmail(email: string): Promise<StoredUserRecord | null> {
	const normalized = normalizeEmail(email);
	if (!normalized) return null;

	const result = await sql<UserRow>(
		`
			SELECT id, email, display_name, password_hash, password_salt, password_iterations, created_at
			FROM users
			WHERE email = $1
			LIMIT 1
		`,
		[normalized],
	);

	const row = result.rows[0];
	if (!row) return null;
	return mapStoredUser(row);
}

async function getPublicUserById(userId: number): Promise<PublicUserRecord | null> {
	const result = await sql<UserRow>(
		`
			SELECT id, email, display_name, password_hash, password_salt, password_iterations, created_at
			FROM users
			WHERE id = $1
			LIMIT 1
		`,
		[userId],
	);

	const row = result.rows[0];
	if (!row) return null;
	const user = await mapStoredUser(row);
	return {
		id: user.id,
		email: user.email,
		displayName: user.displayName,
		companies: user.companies,
	};
}

async function mapStoredUser(row: UserRow): Promise<StoredUserRecord> {
	const companyResult = await sql<CompanyRow>(
		`
			SELECT c.slug
			FROM user_companies uc
			INNER JOIN companies c ON c.id = uc.company_id
			WHERE uc.user_id = $1
			ORDER BY c.slug ASC
		`,
		[row.id],
	);

	return {
		id: row.id,
		email: row.email,
		displayName: row.display_name,
		passwordHash: row.password_hash,
		passwordSalt: row.password_salt,
		passwordIterations: row.password_iterations,
		createdAt: row.created_at.getTime(),
		companies: companyResult.rows.map((company) => company.slug),
	};
}

function normalizeEmail(value: string) {
	const trimmed = value.trim().toLowerCase();
	if (!trimmed || !trimmed.includes("@")) return null;
	return trimmed;
}

function uniqueCompanies(input: string[]) {
	return Array.from(new Set(input.map((company) => normalizeCompanySlug(company)).filter((company): company is string => Boolean(company))));
}
