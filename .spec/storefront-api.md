# Storefront API — Guia de Uso

> Contrato de leitura que o **front** (headless) consome para renderizar o
> catálogo publicado pela NAWA. Referência para o desenvolvimento do storefront.
> **Última atualização:** 2026-07-03

---

## 1. Visão geral

- **Somente leitura.** O front lê; nunca escreve. Toda configuração vive no
  backoffice (spec §2).
- **Só o que está publicado.** A API serve exclusivamente registros com
  `status = published`. Rascunho nunca vaza (spec §9.2).
- **Sem deploy do front** para refletir mudanças: publicou no backoffice, a API
  passa a servir (respeitando o cache, ~1 min).
- Servida por Route Handlers do Next (hoje) — mesma lógica migra para Netlify
  Functions se necessário.

## 2. Base URL

| Ambiente | URL base |
|---|---|
| Produção | `https://nawahealth.netlify.app` |
| Local | `http://localhost:3000` |

Todos os caminhos abaixo são relativos a essa base.

## 3. Autenticação

Toda requisição exige uma **chave de API** (escopo leitura), enviada no header:

```http
Authorization: Bearer nawa_sk_xxx
```

Alternativa equivalente: `x-api-key: nawa_sk_xxx`.

**Regras da chave:**
- Gerada/rotacionada/revogada no backoffice em **Chaves de API** (`/api-keys`).
- É exibida **uma única vez** na criação — o backoffice guarda só o hash.
- **Server-side apenas.** Nunca exponha a chave no browser/bundle do front. O
  front deve chamar a Storefront a partir do seu próprio servidor (Next SSR /
  route handler), não do cliente.
- Escopo **read**. Pode ser revogada/rotacionada a qualquer momento.

## 4. Endpoints

### `GET /api/storefront/catalog`
Jornadas (com planos publicados) e produtos comerciais publicados.

```json
{
  "journeys": [
    {
      "slug": "metabolic-reset",
      "name": "Metabolic Reset",
      "content": {
        "tagline": "Saúde contínua.",
        "description": "",
        "highlights": ["Acompanhamento médico", "GLP-1 incluso"]
      },
      "plans": [
        {
          "slug": "start",
          "name": "Start",
          "basePrice": 390,
          "billingInterval": "monthly",
          "inclusions": ["Acompanhamento médico", "1 fórmula base"]
        }
      ]
    }
  ],
  "products": [
    { "name": "Kit aplicação", "refType": "plan", "refId": "…", "price": 90, "isAddon": true }
  ]
}
```

### `GET /api/storefront/protocols`
Protocolos publicados e suas fórmulas (inclui a ponte GLP-1).

```json
{
  "protocols": [
    {
      "slug": "reset-avancado",
      "name": "Reset Metabólico Avançado",
      "clinicalDescription": "Protocolo com GLP-1.",
      "formulas": [
        { "name": "Semaglutida (magistral)", "form": "sublingual", "dosage": "1,0mg", "supplier": "botane", "isGlp1": true }
      ]
    }
  ]
}
```

### `GET /api/storefront/anamnesis`
Formulários de anamnese publicados, com perguntas ordenadas.

```json
{
  "forms": [
    {
      "slug": "metabolic-reset",
      "name": "Anamnese — Metabolic Reset",
      "questions": [
        {
          "order": 0,
          "type": "single_choice",
          "label": "Nível de atividade física",
          "required": true,
          "options": ["Sedentário", "Leve", "Moderado", "Intenso"],
          "conditional": { "dependsOn": "…", "equals": true }
        }
      ]
    }
  ]
}
```

Tipos de pergunta: `text | number | boolean | single_choice | multiple_choice | scale`.
`conditional` vazio (`{}`) = exibir sempre.

## 5. Erros

| Código | Quando | Corpo |
|---|---|---|
| `200` | Sucesso | payload do endpoint |
| `401` | Sem chave, chave inválida ou revogada | `{ "error": "unauthorized" }` |

O front deve tratar `401` (chave revogada/rotacionada) de forma resiliente.

## 6. Cache e propagação

As respostas vêm com cache de borda:

```
Cache-Control: public, s-maxage=60, stale-while-revalidate=300
Vary: Authorization, x-api-key
```

- O CDN serve do cache por **60s** e serve "stale" por até **5min** enquanto
  revalida em background. A maioria dos acessos nem toca o banco.
- Cache é **por chave** (`Vary`).
- **Propagação de publish**: uma mudança publicada aparece em até ~1 min (TTL).
  No roadmap há purge/revalidate no publish para propagação imediata.
- Recomendação: **o front também deve cachear** o catálogo (revalidação por
  tempo/tag), reduzindo o fan-out.

## 7. Competências — o que a API faz e o que NÃO faz

**Faz**
- Serve o catálogo comercial publicado (jornadas, planos, produtos).
- Serve o catálogo clínico publicado (protocolos, fórmulas, GLP-1).
- Serve os formulários de anamnese publicados (para o front renderizar).

**NÃO faz (por design)**
- Não escreve nada (sem POST/PUT/DELETE).
- Não expõe rascunho (`draft`) nem dado sensível de paciente.
- Não processa pedido/pagamento — esse é outro fluxo (server-side, com
  idempotência e fila; ver `.spec/escalabilidade.md`).
- Não valida cupom listando promoções — a aplicação de desconto no checkout será
  um endpoint dedicado (valida um código específico), não uma listagem pública.
- Não faz autenticação de paciente — o front tem seu próprio contexto de auth.

## 8. Boas práticas para o front

1. Guarde a chave **no servidor** (variável de ambiente), nunca no cliente.
2. Cacheie as respostas no front (o dado muda pouco).
3. Trate `401` (rotação/revogação de chave) sem quebrar a página.
4. Não dependa de campos além do contrato documentado; ele pode ganhar campos
   (aditivo), mas evite acoplar em formato interno.

## 9. Roadmap da API

- **Versionamento**: `/api/storefront/v1/*` para evoluir sem quebrar o front.
- **Purge no publish**: invalidação imediata do cache ao publicar.
- **Rate limiting por chave** e métricas de uso (hit-rate, latência).
- **Endpoint de validação de cupom** (checkout).
- Endpoints de **conteúdo** (landing/área do paciente) quando o módulo de
  Conteúdo entrar (fase seguinte do spec).
