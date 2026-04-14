import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { CompanyStore } from "@/worker/company-store";

const SLUG_RE = /^[a-z0-9-]{1,64}$/;

export function normalizeCompanySlug(value: unknown): string | null {
	if (typeof value !== "string") return null;
	const slug = value.trim().toLowerCase();
	return SLUG_RE.test(slug) ? slug : null;
}

export async function getCompanyStub(namecompany: string): Promise<DurableObjectStub<CompanyStore>> {
	const { env } = await getCloudflareContext({ async: true });
	const id = env.COMPANY_STORE.idFromName(namecompany);
	return env.COMPANY_STORE.get(id);
}
