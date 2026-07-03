import type { NextConfig } from "next";
import { fileURLToPath } from "url";
import { dirname } from "path";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Fixa a raiz do projeto — há um lockfile em ~ que confunde a inferência do Next.
  outputFileTracingRoot: projectRoot,
};

export default nextConfig;
