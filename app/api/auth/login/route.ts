import { NextRequest, NextResponse } from "next/server";
import { appendAuthCookie, createAuthToken, getAuthStore } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
	try {
		const body = (await req.json()) as Record<string, unknown>;
		const email = typeof body.email === "string" ? body.email : "";
		const password = typeof body.password === "string" ? body.password : "";

		if (!email || !password) {
			return NextResponse.json({ error: "Email y contrasena son obligatorios" }, { status: 400 });
		}

		const store = await getAuthStore();
		const user = await store.getUserByEmail(email);
		if (!user) {
			return NextResponse.json({ error: "Usuario o contrasena invalidos" }, { status: 401 });
		}

		const valid = await verifyPassword(password, {
			hash: user.passwordHash,
			salt: user.passwordSalt,
			iterations: user.passwordIterations,
		});

		if (!valid) {
			return NextResponse.json({ error: "Usuario o contrasena invalidos" }, { status: 401 });
		}

		const token = await createAuthToken(user);
		const response = NextResponse.json({
			ok: true,
			user: { id: user.id, email: user.email, displayName: user.displayName, companies: user.companies },
		});
		appendAuthCookie(response, token);
		return response;
	} catch (err) {
		console.error("[auth/login] error:", err);
		return NextResponse.json({ error: "No se pudo iniciar sesion" }, { status: 500 });
	}
}
