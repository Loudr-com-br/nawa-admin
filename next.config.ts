import type { NextConfig } from "next";
import { fileURLToPath } from "url";
import { dirname } from "path";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const PERMISSIONS_POLICY = "camera=(), microphone=(), geolocation=(), payment=()";

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

/**
 * Headers de segurança.
 *
 * Precisam viver AQUI, e não no `[[headers]]` do netlify.toml: aquele bloco só
 * alcança arquivos estáticos. As páginas e rotas de API são servidas pelo
 * runtime do Next (funções da Netlify) e não passam por ele — foi assim que a
 * primeira tentativa entregou os headers no favicon e não no /login. O
 * netlify.toml fica como está, cobrindo os estáticos.
 *
 * A CSP entra em Report-Only de propósito: o MUI injeta estilo em tempo de
 * execução e o Next injeta script inline de hidratação, então uma CSP rígida
 * derrubaria a aplicação. Report-Only mede primeiro; com os relatórios limpos,
 * troca-se o nome do header.
 */
const SECURITY_HEADERS = [
  // Impede que a aplicação seja embutida em iframe de terceiros (roubo de clique).
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: PERMISSIONS_POLICY },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Content-Security-Policy-Report-Only", value: CSP },
];


const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Fixa a raiz do projeto — há um lockfile em ~ que confunde a inferência do Next.
  outputFileTracingRoot: projectRoot,
  // Otimização das imagens do catálogo (Storage do Supabase) — evita baixar o
  // PNG original de ~1 MB por miniatura na lista/detalhe do catálogo.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }],
  },
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      // Resposta de API nunca deve ser indexada.
      { source: "/api/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
};

export default nextConfig;
