// Wrapper que inyecta nuestro Durable Object al worker generado por OpenNext.
// `.open-next/worker.js` se genera con `opennextjs-cloudflare build`.
export { default } from "./.open-next/worker.js";
export { CompanyStore } from "./worker/company-store";
