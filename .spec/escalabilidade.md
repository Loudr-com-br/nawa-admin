# NAWA Backoffice — Escalabilidade da Storefront

> Nota de arquitetura. Registra a estratégia para o consumo do catálogo pelo
> front crescer sem derrubar o processamento de pedido.
> **Última atualização:** 2026-07-03

## O ponto de partida

Conforme o front (headless) ganhar tráfego, o volume de leitura do catálogo
publicado pode crescer muito. A preocupação legítima: a API aguentar o pico
**sem comprometer o processamento de pedido/pagamento**.

A chave é **separar dois problemas que escalam de formas diferentes**:

| | Leitura de catálogo | Processamento de pedido |
|---|---|---|
| Muda com frequência? | Não (só em publish) | Sim (cada checkout) |
| Cacheável? | **Sim** (edge/CDN) | Não |
| Desafio | Volume de acessos | Confiabilidade sob pico |
| Solução | Cache + invalidação | Idempotência + fila |

## 1. Leitura de catálogo — cache absorve o tráfego

O **publish model** foi desenhado para isto: o dado servido é sempre
`status = published` e só muda em evento de publish. Logo, é seguro cachear.

**Já implementado (quick wins):**
- Endpoints `/api/storefront/*` respondem com `Cache-Control`/
  `Netlify-CDN-Cache-Control`: `s-maxage=60, stale-while-revalidate=300`.
  O CDN da Netlify absorve o grosso do tráfego; a maioria dos acessos nem toca
  a função nem o Postgres.
- `Vary: Authorization, x-api-key` → cache por chave; sem chave nunca reaproveita
  cache autenticado (cai na função e recebe 401).
- `last_used_at` deixou de gravar por request (throttle de 5 min) — elimina a
  escrita-por-leitura que não escalava.

**Roadmap:**
- **Purge/revalidate no publish**: ao publicar algo no backoffice, invalidar a
  chave de cache correspondente (propagação rápida sem esperar o TTL).
- **Cache no front também**: o front (Next SSR) deve cachear o catálogo,
  reduzindo ainda mais o fan-out.
- **Cache KV do catálogo publicado** (ex: edge KV) se a taxa de publish crescer.

## 2. Processamento de pedido — onde mora o risco real

Não é cacheável. Escala aqui = **confiabilidade**, não throughput bruto.

- **Idempotência** na criação de cobrança/pedido (spec §8.5) → pico não gera
  pedido/cobrança duplicados.
- **Fila + assíncrono**: o checkout aceita rápido e enfileira; o processamento
  (Pagar.me, envio à Botane §9.1) roda fora do request (Netlify Background
  Functions ou fila tipo `pgmq`/Supabase Queues).
- **Webhooks de pagamento assinados** (spec §8.5), validados por assinatura, com
  retry.
- **Isolamento**: um pico de leitura do catálogo não pode competir por recurso
  com o processamento de pedido.

## 3. Camada de dados e operação

- **Pooler do Supabase** (Supavisor/pgBouncer) — obrigatório com serverless para
  não esgotar conexões.
- **Índices** (já criados nas FKs e em `status`); depois **materialized views**
  ou cache KV do catálogo.
- **Read replicas** quando a leitura não-cacheável crescer.
- **Rate limiting por chave** e **versionamento da API** (`/api/storefront/v1`)
  para evoluir sem quebrar o front.
- **Observabilidade/alertas** (fase seguinte do spec): latência, erro, hit-rate
  de cache, filas.

## Resumo (mental model)

Cachear a leitura agressivamente (o publish model habilita isso), endurecer a
escrita com idempotência + fila, e manter os dois caminhos **isolados**. Assim o
front pode viralizar sem derrubar o processamento de pedido.
