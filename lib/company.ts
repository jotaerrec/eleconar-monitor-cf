const SLUG_RE = /^[a-z0-9-]{1,64}$/;

export function normalizeCompanySlug(value: unknown): string | null {
	if (typeof value !== "string") return null;
	const slug = value.trim().toLowerCase();
	return SLUG_RE.test(slug) ? slug : null;
}
