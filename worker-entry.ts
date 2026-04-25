// Wrapper que inyecta nuestro Durable Object al worker generado por OpenNext.
// `.open-next/worker.js` se genera con `opennextjs-cloudflare build`.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - artifact generado en build time, sin tipos disponibles en este paso.
export { default } from "./.open-next/worker.js";
export { CompanyStore } from "./worker/company-store";
