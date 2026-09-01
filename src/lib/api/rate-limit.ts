import "server-only";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";

/**
 * Rate limiting das rotas de ESCRITA (checkout, pagamento, cadastro).
 *
 * O limitador da Storefront (`lib/storefront/rate-limit`) conta por chave de
 * API e só serve para o tráfego server-to-server. Aqui o sujeito é o paciente
 * — ou o IP, quando ainda não há conta — e o alvo é outro: impedir que alguém
 * varra cartões contra o endpoint de pagamento.
 *
 * **Fail-open**, igual ao outro: se o limitador cair, a requisição passa. Uma
 * indisponibilidade do contador nunca deve impedir um cliente legítimo de
 * pagar. O limite protege contra abuso, não é controle de acesso.
 */

export interface RateVerdict {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
}

/**
 * Identifica quem está chamando, preferindo a identidade real ao IP.
 *
 * O IP vem de header e, portanto, é forjável — mas é atrás do CDN da Netlify,
 * que reescreve `x-nf-client-connection-ip`, então serve como aproximação para
 * quem ainda não tem sessão. Sempre que houver paciente autenticado, ele é a
 * chave melhor: sobrevive a troca de rede e não pune quem divide o IP.
 */
export function subjectOf(request: Request, patientId?: string | null): string {
  if (patientId) return `patient:${patientId}`;
  const ip =
    request.headers.get("x-nf-client-connection-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "desconhecido";
  return `ip:${ip}`;
}

/** Registra o acesso e devolve o veredito. Nunca lança. */
export async function hitRateLimit(
  scope: string,
  subject: string,
  opts: { limit?: number; windowSeconds?: number } = {},
): Promise<RateVerdict> {
  const limit = opts.limit ?? env.WRITE_RATE_LIMIT;
  const windowSeconds = opts.windowSeconds ?? env.WRITE_RATE_WINDOW_SECONDS;
  const fallback: RateVerdict = {
    allowed: true,
    limit,
    remaining: limit,
    resetAt: new Date(Date.now() + windowSeconds * 1000),
  };

  try {
    const sb = createAdminClient();
    const { data, error } = await sb.rpc("rate_hit", {
      p_scope: scope,
      p_subject: subject,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    const row = Array.isArray(data) ? data[0] : data;

    if (error || !row) {
      // Fail-open é a decisão certa — mas em silêncio ela vira um controle de
      // segurança que parece existir e não faz nada. É exatamente o padrão que
      // deixou o webhook aceitando um segredo público por semanas. Se a função
      // não existe no banco, isto grita no log até alguém aplicar a migration.
      console.error(
        `[rate-limit] limitador INATIVO scope=${scope} — ${error?.message ?? "resposta vazia"}. ` +
          `Se for "function rate_hit does not exist", falta aplicar a migration 20260901120001.`,
      );
      return fallback;
    }

    return {
      allowed: row.allowed,
      limit,
      remaining: row.remaining,
      resetAt: new Date(row.reset_at),
    };
  } catch (e) {
    console.error(`[rate-limit] limitador INATIVO scope=${scope} — ${(e as Error).message}`);
    return fallback;
  }
}

/**
 * Aplica o limite e devolve a resposta 429 pronta, ou `null` para seguir.
 *
 * Uso nas rotas:
 *   const limite = await enforceWriteLimit(request, "checkout:pay", patientId);
 *   if (limite) return limite;
 */
export async function enforceWriteLimit(
  request: Request,
  scope: string,
  patientId?: string | null,
  opts: { limit?: number; windowSeconds?: number } = {},
): Promise<NextResponse | null> {
  const subject = subjectOf(request, patientId);
  const verdict = await hitRateLimit(scope, subject, opts);
  if (verdict.allowed) return null;

  const retryAfter = Math.max(1, Math.ceil((verdict.resetAt.getTime() - Date.now()) / 1000));
  console.warn(`[rate-limit] bloqueado scope=${scope} subject=${subject} limite=${verdict.limit}`);

  return NextResponse.json(
    { error: "rate_limited", detail: "Muitas tentativas. Aguarde alguns instantes." },
    {
      status: 429,
      headers: {
        "Cache-Control": "no-store",
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": String(verdict.limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(verdict.resetAt.getTime() / 1000)),
      },
    },
  );
}
