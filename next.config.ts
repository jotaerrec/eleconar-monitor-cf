import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {};

// Expone los bindings (Durable Objects, etc.) al `next dev` local cuando wrangler.jsonc está presente.
initOpenNextCloudflareForDev();

export default nextConfig;
