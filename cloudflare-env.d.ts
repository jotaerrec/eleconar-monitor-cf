import type { CompanyStore } from "./worker/company-store";

declare global {
	interface CloudflareEnv {
		COMPANY_STORE: DurableObjectNamespace<CompanyStore>;
	}
}

export {};
