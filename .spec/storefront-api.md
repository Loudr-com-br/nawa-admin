# Storefront API — Guia de Uso (v2)

> Contrato de leitura que o **front** (headless) consome para renderizar o
> catálogo publicado pela NAWA. Referência para o desenvolvimento do storefront.
> **Última atualização:** 2026-07-24 (atualizado para o Catálogo v2).
>
> Base técnica das regras: [`catalogo-protocolos-v2.md`](catalogo-protocolos-v2.md).
> Endurecimento da fronteira antes do lançamento: `frontoffice/.spec/api-boundary.md`.

---

## 1. Visão geral

- **Somente leitura.** O front lê; nunca escreve. Toda configuração vive no
  backoffice (spec §2).
- **Só o que é publicado E público.** A API serve exclusivamente registros com
  `status = published` e `visibility = public`. Rascunho e `medical_only` nunca
  vazam (spec §9.2) — a trava é *fail-closed* e não é configurável pelo front.
- **Sem deploy do front** para refletir mudanças: publicou no backoffice, a API
  passa a servir (respeitando o cache, ~1 min ou o purge imediato).
- Servida por Route Handlers do Next (hoje) — mesma lógica migra para Netlify
  Functions se necessário.

---

## 2. Base URL

| Ambiente | URL base |
|---|---|
| Produção | `https://nawahealth.netlify.app` |
| Local | `http://localhost:3000` |

Todos os caminhos abaixo são relativos a essa base.

---

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

---

## 4. Endpoints

Quatro superfícies de leitura. Todas devolvem apenas `published` + `public`.

### `GET /api/storefront/items`
Itens/SKUs publicados, públicos e que vendem avulso (`sells_standalone = true`).

```json
{
  "items": [
    {
      "slug": "vitamina-d3-2000ui",
      "name": "Vitamina D3 2000UI",
      "itemType": "supplement",
      "form": "capsule",
      "description": "",
      "composition": {},
      "price": 90,
      "isGlp1": false
    }
  ]
}
```

Nunca trafega: `cost`, `external_ref`, `claim_internal`, `supplier_id` (spec §6.1).

### `GET /api/storefront/protocols`
Protocolos/kits publicados e públicos, com seus itens.

```json
{
  "protocols": [
    {
      "slug": "reset-avancado",
      "name": "Reset Metabólico Avançado",
      "clinicalDescription": "Protocolo com acompanhamento.",
      "pageContent": "",
      "claimPublic": "",
      "price": 690,
      "items": [
        { "name": "Vitamina D3 2000UI", "form": "capsule", "composition": {}, "quantity": 1 }
      ]
    }
  ]
}
```

- **Fail-closed:** se algum item do kit for `medical_only`, o protocolo inteiro
  **não sai** (nem o kit, nem a linha do item).
- `claimPublic` só vem preenchido se o claim estiver **aprovado**
  (`claim_status = approved`); caso contrário vem `""`.
- `pageContent` é o corpo editorial da página do protocolo (string; `""` se vazio).

### `GET /api/storefront/collections`
Coleções publicadas e públicas, com membros próprios e o **rollup** dos filhos.

```json
{
  "collections": [
    {
      "slug": "metabolic-reset",
      "name": "Metabolic Reset",
      "description": "",
      "parentSlug": null,
      "members": [
        { "refType": "protocol", "slug": "reset-avancado", "name": "Reset Metabólico Avançado" }
      ],
      "rollupMembers": [
        { "refType": "item", "slug": "vitamina-d3-2000ui", "name": "Vitamina D3 2000UI" }
      ]
    }
  ]
}
```

- `refType` é `"item"` ou `"protocol"`.
- `members` = membros diretos da coleção. `rollupMembers` = membros herdados dos
  descendentes (coleções filhas públicas).
- `parentSlug` = `null` na raiz, ou o slug da coleção pai (se ela também for pública).
- Membro `medical_only` ou não-publicado **nunca** entra — nem em `members`, nem
  no `rollupMembers`.

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
`conditional` vazio (`{}`) = exibir sempre. **A lógica condicional, o score e a
recomendação são avaliados no backoffice** — o front só renderiza (spec §7).

---

## 5. Erros

| Código | Quando | Corpo |
|---|---|---|
| `200` | Sucesso | payload do endpoint |
| `401` | Sem chave, chave inválida ou revogada | `{ "error": "unauthorized" }` |

O front deve tratar `401` (chave revogada/rotacionada) de forma resiliente — sem
quebrar a página (estado vazio / cache stale).

---

## 6. Cache e propagação

As respostas vêm com cache de borda:

```
Cache-Control: public, max-age=0, s-maxage=60, stale-while-revalidate=300
Netlify-CDN-Cache-Control: public, max-age=0, s-maxage=60, stale-while-revalidate=300
Netlify-Cache-Tag: storefront-items          # (ou -protocols / -collections / -anamnesis)
Vary: Authorization, x-api-key
```

- O CDN serve do cache por **60s** e serve "stale" por até **5min** enquanto
  revalida em background. A maioria dos acessos nem toca o banco. Sem cache no
  browser (`max-age=0`): a decisão de cache fica no CDN.
- Cache é **por chave** (`Vary`). Requisição sem chave nunca reaproveita um cache
  autenticado (cai na função e recebe 401).
- **Propagação de publish é imediata** via purge por tag. Tags:
  `storefront-items`, `storefront-protocols`, `storefront-collections`,
  `storefront-anamnesis`. O TTL de 60s é só fallback.
- **Purge em cascata** (uma mudança repercute em mais de uma superfície):
  - publicar/alterar **item** → purga `items` + `collections` + `protocols`
    (preço/visibilidade do membro afeta kits e coleções);
  - publicar/alterar **protocolo** → purga `protocols` + `collections`;
  - publicar/alterar **anamnese** → purga `anamnesis`.
- Recomendação: **o front também deve cachear** (revalidação por tempo/tag),
  reduzindo o fan-out.

---

## 7. Competências — o que a API faz e o que NÃO faz

**Faz**
- Serve o catálogo publicado: itens, protocolos (kits) e coleções.
- Serve os formulários de anamnese publicados (para o front renderizar).
- Aplica o fail-closed de `medical_only` em todas as superfícies, inclusive no
  rollup de coleção.

**NÃO faz (por design)**
- Não escreve nada (sem POST/PUT/DELETE).
- Não expõe rascunho (`draft`), `medical_only`, nem dado sensível de paciente.
- Não expõe dado interno do item (`cost`, `external_ref`, `claim_internal`,
  `supplier_id`).
- Não processa pedido/pagamento — esse é outro fluxo (superfície de checkout,
  server-side, com idempotência; spec §6.2 e `.spec/escalabilidade.md`).
- Não valida cupom listando promoções — a aplicação de desconto no checkout será
  um endpoint dedicado (valida um código específico), não uma listagem pública.
- Não faz autenticação de paciente — o front tem seu próprio contexto de auth
  (superfície de painel, spec §6.3).

---

## 8. Boas práticas para o front

1. Guarde a chave **no servidor** (variável de ambiente), nunca no cliente.
2. Cacheie as respostas no front (o dado muda pouco).
3. Trate `401` (rotação/revogação de chave) sem quebrar a página.
4. **Não refiltre por visibilidade.** A API já entregou só o que é público; se o
   dado chegou, pode ser exibido (spec §4). Filtrar de novo cria dois lugares
   decidindo quem vê o quê.
5. **Não calcule o preço para cobrar.** Exiba a soma para o usuário entender o
   carrinho, mas o valor cobrado é sempre o que o backoffice calcula no
   fechamento (spec §4, §6.2).
6. Não dependa de campos além do contrato documentado; ele pode ganhar campos
   (aditivo), mas evite acoplar em formato interno.

---

## 9. Roadmap da API

> Endurecimento consolidado em `frontoffice/.spec/api-boundary.md` — trabalho de
> uma **semana dedicada antes do lançamento**.

- **Versionamento**: `/api/storefront/v1/*` para evoluir sem quebrar o front.
- **Indexação e busca**: paginação, filtros e índice de busca do catálogo (hoje
  as rotas devolvem listas completas).
- **Contrato tipado compartilhado**: formalizar o formato (schema/validação) — o
  front espelha os tipos à mão hoje.
- **Rate limiting por chave** e métricas de uso (hit-rate, latência).
- **Endpoint de validação de cupom** (checkout).
- Endpoints de **conteúdo** (landing/área do paciente) quando o módulo de
  Conteúdo entrar (fase seguinte do spec).
