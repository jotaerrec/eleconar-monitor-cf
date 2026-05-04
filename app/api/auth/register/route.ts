import { NextRequest, NextResponse } from "next/server";
import { appendAuthCookie, createAuthToken, getAuthStore } from "@/lib/auth";
import { normalizeCompanySlug } from "@/lib/company";
import { hashPassword } from "@/lib/password";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
	try {
		const body = (await req.json()) as Record<string, unknown>;
		const name = typeof body.name === "string" ? body.name.trim() : "";
		const email = typeof body.email === "string" ? body.email : "";
		const password = typeof body.password === "string" ? body.password : "";
		const companies = Array.isArray(body.companies)
			? body.companies
					.map((company) => (typeof company === "string" ? normalizeCompanySlug(company) : null))
					.filter((company): company is string => Boolean(company))
			: [];

		if (!email || !password) {
			return NextResponse.json({ error: "Email y contrasena son obligatorios" }, { status: 400 });
		}
		if (password.length < 8) {
			return NextResponse.json({ error: "La contrasena debe tener al menos 8 caracteres" }, { status: 400 });
		}
		if (companies.length === 0) {
			return NextResponse.json({ error: "Debes indicar al menos una empresa" }, { status: 400 });
		}

		const store = await getAuthStore();
		const passwordData = await hashPassword(password);
		const user = await store.createUser({
			displayName: name || null,
			email,
			companies,
			passwordHash: passwordData.hash,
			passwordSalt: passwordData.salt,
			passwordIterations: passwordData.iterations,
		});

		const token = await createAuthToken(user);
		const response = NextResponse.json({ ok: true, user });
		appendAuthCookie(response, token);
		return response;
	} catch (err) {
		const message = err instanceof Error ? err.message : "No se pudo crear el usuario";
		const status = message.includes("registrado") || message.includes("empresa") ? 400 : 500;
		console.error("[auth/register] error:", err);
		return NextResponse.json({ error: message }, { status });
	}
}
