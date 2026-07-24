import type { NextConfig } from "next";
import { fileURLToPath } from "url";
import { dirname } from "path";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Fixa a raiz do projeto — há um lockfile em ~ que confunde a inferência do Next.
  outputFileTracingRoot: projectRoot,
  // Otimização das imagens do catálogo (Storage do Supabase) — evita baixar o
  // PNG original de ~1 MB por miniatura na lista/detalhe do catálogo.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }],
  },
};

export default nextConfig;
