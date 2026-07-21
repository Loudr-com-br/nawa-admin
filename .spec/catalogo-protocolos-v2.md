# Catálogo e Protocolos v2 — Especificação

> Reescrita da arquitetura de catálogo do backoffice NAWA.
> Substitui a SPEC-PROTOCOLOS-v1. Altera seções 4, 5 e 6 da SPEC.md principal.
> Destinado a consumo direto por agente de código (Claude Code).

---

## 0. Decisões aplicadas (2026-07-17)

Correções sobre o rascunho original da v2, decididas com o cliente. Onde esta seção
conflita com o corpo abaixo, **esta seção vence** (o corpo já foi ajustado para refletir).

1. **`plans` não morre — é reorganizado.** O plano deixa de ser catálogo e passa a ser
   uma **definição de checkout/carrinho**, aplicada no processo de finalização de compra
   (construção de assinatura). Não é depreciado nem removido; a tabela é repropósito.
   Corrige o conflito interno em que §4/§14 matavam `plans` enquanto §11 dizia que ele só
   sai do catálogo. Vale §11.
2. **Fluxo de telemedicina fica para depois.** Existirão protocolos que só podem ser
   prescritos por médico **e** exigem apoio de teleconsulta para serem vendidos — um fluxo
   de venda distinto de visibilidade. Esse eixo **não** é modelado nesta spec; registrado
   como ponto aberto em §17.
3. **Item/SKU sempre tem preço.** `cost` vem do fornecedor quando existe; se não vier
   (ex.: Botane não expõe custo, ou serviço interno), a **precificação é da NAWA** via
   `price`. `price` é sempre propriedade NAWA e nunca pode ficar nulo em item publicado.
4. **GLP-1 é item/produto comum, não caso especial de sistema.** Pode ter diversos
   fornecedores (via `suppliers`) e estar em mais de um protocolo (via `protocol_items`).
   `is_glp1` é só flag auxiliar de tratamento comercial; quem governa visibilidade é
   `item_type`.

---

## 1. Por que esta reescrita

A modelagem anterior tratava a NAWA como plataforma clínica que formula e depois embrulha comercialmente. Isso gerou duas camadas paralelas, catálogo clínico e catálogo comercial, ligadas por uma entidade de ponte.

O entendimento correto é outro. A NAWA não formula. Ela faz curadoria de SKUs prontos e aplica inteligência na anamnese para sugerir composições. O item que chega do fornecedor é um frasco: tem nome, rótulo, dose, preço e vende sozinho. Isso é comércio com inteligência na entrada, não plataforma clínica com loja acoplada.

A consequência é que as duas camadas colapsam em uma. O item já nasce comercial. A distinção entre o que é público e o que é médico continua existindo, mas como atributo, não como arquitetura paralela.

Esta spec simplifica em vez de acrescentar. Ela remove mais entidades do que cria.

---

## 2. Modelo

```
Fornecedor       Botane, parceiros de GLP-1, NAWA (serviços)
   ↓
Item (SKU)       vem pronto, preço próprio, vende avulso
   ↓  N↔N
Protocolo        kit curado pela NAWA, preço próprio, página/descrição própria
   ↓
Carrinho         N protocolos mais M itens avulsos
   ↓
Assinatura       recorrência configurada no checkout (reorg. do antigo plano)

Coleção          categoriza item e protocolo, plana ou hierárquica
```

**Fornecedor** é a origem do item. A Botane é o primeiro, não o único. O GLP-1 original vem de parceiro. Serviços prestados pela própria NAWA (acompanhamento, consulta, análise de exames) também são itens, com a NAWA como fornecedor interno.

**Item** é a unidade atômica vendável. Vem pronto. A NAWA não edita composição, dose ou forma. Só recebe, enriquece com a camada que é dela e publica.

**Protocolo** é a curadoria da NAWA, o único lugar onde ela autora. É um **kit** de itens com preço próprio e **página/descrição própria** — conteúdo editorial de como o kit é, não só um agrupamento invisível. É a propriedade intelectual da operação, conforme a tese do Golden Protocol de que a diferenciação vem de organizar os ativos certos, não de ter mais ativos.

**Carrinho** combina protocolos e itens avulsos. É o que a anamnese monta. A recorrência
(o antigo plano) é definida aqui, no checkout — ver §11.

**Coleção** é a categorização mercadológica. Agrupa **itens e protocolos** (produtos e kits), sem exclusividade: o mesmo item vive em várias coleções. É plana por padrão e hierárquica quando precisa, no mesmo mecanismo. Substitui o módulo de nomenclatura e atributos, e absorve o que era jornada.

---

## 3. Nomenclatura

`Fórmula` passa a se chamar `Item`.

Justificativa: o Golden Protocol usa "Fórmula A", "Fórmula B" como nome de itens específicos da Botane, não como nome da classe. Quando Ômega-3 (produto pronto), GLP-1 original (medicamento acabado) e acompanhamento (serviço) entram na mesma tabela, "fórmula" passa a ser um nome errado para a maioria das linhas. `Item` cobre todos os casos sem mentir.

Isto é rename de entidade, não de rótulo. Os itens continuam podendo se chamar "Fórmula A" no campo `name`.

---

## 4. O que morre

| Entidade | Por quê |
|---|---|
| `commercial_products` | Era ponte entre catálogo clínico e comercial. Se o item já nasce com preço, ele é a entidade comercial. A ponte ligava a mesma margem. |
| `protocol_includes` | Não existe bundle dentro de bundle. Core Premium é carrinho com duas linhas, não protocolo que inclui protocolo. |
| `formula_actives` | Composição é descritiva e somente leitura. Estrutura só se paga quando você escreve ou consulta. A NAWA não faz nem um nem outro. Vira `jsonb`. |
| `formulas.protocol_id` | Item precisa existir fora de protocolo (GLP-1 avulso). Vira N↔N. |
| `protocols.external_ref` | Protocolo é sempre autoral NAWA. Origem externa é do item. |
| `is_glp1` como governador de visibilidade | Substituído por `item_type`. Permanece só como flag auxiliar de tratamento comercial. |
| `journeys` | Absorvida por coleção. Metabolic Reset é coleção de topo. Longevidade amanhã é outra. O requisito do briefing de nascer preparada para múltiplas jornadas passa a ser atendido por cadastro, não por migração. |
| `attributes` e `entity_attributes` | Substituídos por coleção. O que era atributo tipado virou coluna no item (`item_type`, `pharmaceutical_form`). O que era categoria virou coleção. O que era elegibilidade é do motor de anamnese. |

**`plans` NÃO morre.** Ver §0.1 e §11: o plano deixa de ser catálogo e é reorganizado
como definição de checkout/carrinho (construção de assinatura). A tabela é mantida e
repropósito, não depreciada. Serviços que viviam dentro do plano viram itens de tipo
`servico` (fornecedor interno NAWA); o vínculo do plano com o que ele inclui passa a ser
expresso pela composição de carrinho.

As três camadas do Golden Protocol (Core Metabolic, Core Premium, Full Personalizado) deixam de existir como dado. Core Metabolic é protocolo real. Core Premium e Full Personalizado são nomes de composição comum de carrinho. Continuam existindo como narrativa no site e nos documentos, mas o banco não precisa saber.

Consequência boa: se amanhã a operação decidir empacotar e vender Premium direto, basta criar mais um protocolo. Vira decisão de merchandising, não de schema.

---

## 5. Schema

```
suppliers
  id, slug, name
  type              pharmacy | partner | internal
  status            active | inactive
  created_at, updated_at

items                              -- rename de "formulas"
  id, slug, name
  supplier_id       fk → suppliers
  external_ref      id no sistema do fornecedor
  item_type         manipulado | medicamento | suplemento | servico
  pharmaceutical_form  capsula | sache | sublingual | topico | outro | na
  description       texto descritivo, origem fornecedor
  composition       jsonb, descritivo, somente leitura
  cautions          jsonb, lista de { type, description }
  cost              numeric, informado pelo fornecedor (nullable; nem todo fornecedor expõe)
  price             numeric NOT NULL, definido pela NAWA (obrigatório em item publicado)
  is_glp1           boolean default false, flag auxiliar de tratamento comercial
  sells_standalone  boolean
  visibility        public | medical_only
  status            draft | published
  synced_at
  created_at, updated_at
  unique (supplier_id, external_ref)

protocols
  id, slug, name
  clinical_description
  page_content      jsonb, conteúdo editorial do kit (como o kit é)
  claim_internal
  claim_public
  claim_status      draft | pending_review | approved | rejected
  claim_reviewed_by, claim_reviewed_at
  price             numeric NOT NULL
  price_source      sum | manual
  visibility        public | medical_only
  status            draft | published
  version           int default 1
  created_at, updated_at

protocol_items
  id
  protocol_id       fk
  item_id           fk
  quantity          int default 1
  order             int
  unique (protocol_id, item_id)

protocol_versions
  id, protocol_id, version, snapshot jsonb, published_at, published_by

collections
  id, slug, name
  description
  parent_id         fk → collections, nullable
  visibility        public | internal
  status            draft | published
  order             int
  created_at, updated_at

collection_members
  id
  collection_id     fk
  ref_type          item | protocol
  ref_id
  order             int
  unique (collection_id, ref_type, ref_id)
```

Regras de coleção:
- `parent_id` nulo significa coleção plana. Preenchido significa nó de árvore mercadológica. Um mecanismo, dois usos.
- Proibir ciclo na validação do save.
- Sem limite rígido de profundidade no schema. Três níveis é o que a UI aguenta bem; passar disso é sinal de que a árvore está sendo usada como taxonomia clínica, que não é o caso de uso.
- Coleção guarda **item e protocolo** (produto e kit). É o que permite Metabolic Reset existir como coleção contendo o Core Metabolic. (Confirmado — deixou de ser ponto aberto.)
- Coleção pai exibe os membros dos filhos na leitura, comportamento padrão de árvore mercadológica. Rollup em tempo de leitura, não duplicação de linha.

Pedidos e assinaturas ganham linhas (o `plan_id` **permanece** — ver §11):

```
order_lines
  id, order_id
  ref_type          item | protocol
  ref_id
  name_snapshot
  quantity, unit_price
  supplier_id
  created_at

subscription_lines
  id, subscription_id
  ref_type          item | protocol
  ref_id
  quantity, unit_price
```

Nota sobre `composition` como jsonb: estrutura relacional só se paga quando alguém escreve ou consulta o dado. A NAWA não escreve (vem do fornecedor) e não consulta (só exibe). Se um dia surgir necessidade de buscar protocolos por ativo, para checagem de interação por exemplo, promover para tabela. Não antecipar.

---

## 6. Regra de preço

Todo item/SKU tem preço. `cost` vem do fornecedor quando existe; quando não vem (Botane não
expõe custo, ou item de serviço interno), a **precificação fica na NAWA** via `price`. `price`
é sempre propriedade NAWA e é obrigatório em item publicado.

O protocolo nasce com o preço da soma dos itens, mas o preço é dele, não derivado.

Comportamento:
- Na criação, `price` recebe `soma(item.price × quantity)` e `price_source = 'sum'`.
- Ao editar o preço manualmente, `price_source = 'manual'`. O valor permanece.
- Nunca recalcular automaticamente. Nem quando o preço de um item muda, nem quando um item entra ou sai do protocolo.
- Kit tem desconto. O preço do protocolo normalmente não é a soma. Isso é esperado, não é erro.

Deriva de preço:

Como o preço nunca recalcula, ele envelhece em silêncio. A Botane sobe o custo, o item sobe, e o kit continua no valor antigo com a margem sendo comida sem ninguém ver.

O sistema deve mostrar, nunca corrigir:
- Na lista e no detalhe do protocolo, quando `price` diverge da soma atual dos itens, exibir a divergência. Ex: preço R$500, soma atual R$540.
- Aviso visual, não bloqueio. Publicar continua permitido.
- Quando `price_source = 'sum'`, oferecer ação de recalcular em um clique. Quando é `manual`, não oferecer, porque alguém decidiu aquele número de propósito.

Mesma lógica vale para o item: `cost` vem do fornecedor, `price` é da NAWA e não segue o custo. Exibir margem no detalhe do item (quando há `cost`).

---

## 7. Visibilidade

Dois valores apenas: `public` e `medical_only`. A camada premium morreu junto com a
distinção de catálogo.

> **Nota de escopo:** o **fluxo de venda com telemedicina** (protocolo que exige teleconsulta
> para ser vendido) é um eixo distinto de visibilidade e **não** é modelado nesta spec. Ver
> §17. Visibilidade responde "quem enxerga", não "como se vende".

Regras duras:
- `item_type = 'medicamento'` força `visibility = 'medical_only'`. A UI trava o seletor e explica.
- Protocolo é tão restrito quanto seu item mais restrito. Se qualquer item do grupo é `medical_only`, o protocolo é forçado a `medical_only`.
- Visibilidade é ortogonal a status. Publicado significa pronto e válido. Visibilidade define quem enxerga.

A segunda regra é validação, não invenção: ela codifica a decisão 10 do Golden Protocol, que tira GLP-1 e medicamentos do Core justamente porque o Core é público.

**Enforce em dois lados.** Além da validação na escrita (save do protocolo, add de item),
a regra de visibilidade do protocolo deve ser re-checada na query da Storefront (fail-closed
no momento de servir), para cobrir o caso de um item que vira `medical_only` depois que o
protocolo já estava público.

---

## 8. Claims

Campos em `protocols`: `claim_internal`, `claim_public`, `claim_status`.

- `claim_public` só é servido quando `claim_status = 'approved'`. Em qualquer outro estado, omitir. Não usar o interno como fallback.
- Editar `claim_public` rebaixa `claim_status` para `draft`. Aprovação vale para o texto aprovado.
- A UI mostra o estado do claim com destaque, porque é bloqueio regulatório, não metadado.
- **Aberto:** quem tem permissão de mover `draft → approved` (papel médico?) — RBAC da
  aprovação não fechado, ver §17.

Referência do Golden Protocol para o Core Metabolic. Claim interno: base metabólica para iniciar jornada de emagrecimento e ajuste metabólico, com ou sem GLP-1. Claim público: suporte nutricional e metabólico para iniciar sua jornada de emagrecimento com acompanhamento profissional.

---

## 9. Propriedade de campo

O fornecedor escreve: `name` (inicial), `description`, `composition`, `pharmaceutical_form`, `cautions`, `cost`, `external_ref`.

A NAWA escreve: `price`, `visibility`, `sells_standalone`, `status`, atributos de taxonomia, e tudo em `protocols`.

Campos de propriedade do fornecedor ficam somente leitura na UI, com indicação visual da origem. Se alguém editar composição no backoffice, o próximo sync sobrescreve ou entra em conflito, e passa a existir duas verdades sobre o que o paciente está tomando. Não permitir.

Exceção: itens de fornecedor `type = 'internal'` (serviços da NAWA) são editáveis normalmente, porque a NAWA é o fornecedor deles.

---

## 10. Storefront API

`/api/storefront/items`: serve apenas `status = published` **e** `visibility = 'public'` **e** `sells_standalone = true`.

`/api/storefront/protocols`: serve apenas `status = published` **e** `visibility = 'public'`.

`/api/storefront/collections`: serve apenas `status = published` **e** `visibility = 'public'`.
Substitui o que o front consumia como jornada. Retorna a árvore (ou lista plana) de
coleções com seus membros já filtrados pela visibilidade — um membro `medical_only` nunca
aparece no rollup público, mesmo que a coleção seja pública. O rollup dos filhos é resolvido
no servidor (§5); o front recebe a árvore pronta.

Campos servidos:
- `composition` pode ser servida publicamente. É o que está no rótulo do frasco.
- `claim_public` apenas se aprovado.
- Nunca servir: `cost`, `external_ref`, `claim_internal`, `supplier_id`.

Teste de aceite obrigatório: protocolo ou item `published` com `visibility = 'medical_only'` não retorna em nenhuma resposta da Storefront API — incluindo dentro do rollup de uma coleção pública.

---

## 11. Módulos e navegação

O catálogo se separa em três entradas de menu, cada uma com um propósito distinto:

**Catálogo** lista apenas itens e SKUs. É o inventário do que existe para vender, venha da Botane, de parceiro ou da própria NAWA.

**Protocolos** lista os kits. Mesmo com o schema reduzido a agrupamento com preço e claim, o módulo permanece como entrada própria. Razão: protocolo é o vocabulário do sistema. A anamnese sugere protocolo, o médico prescreve protocolo, o Golden Protocol fala protocolo. Se sumisse do menu, o backoffice falaria uma língua e a operação outra.

**Coleções** gerencia a categorização. Substitui o antigo módulo de nomenclatura e atributos.

Fora do catálogo:

**Assinatura e plano** deixam de ser catálogo e passam a ser **configuração de checkout**. O
plano **não é removido** — é reorganizado para essa camada (§0.1). O checkout define se a
compra é única ou recorrente, com qual intervalo e qual desconto de recorrência, sobre uma
composição de carrinho. Não existe mais catálogo de planos, mas a definição de recorrência
(o que o plano era) continua existindo, agora no checkout.

O módulo de **Assinaturas** continua existindo, mas como operação, não como catálogo: estado, pausa, cancelamento, retentativa de cobrança, churn. Configurar recorrência e operar recorrência são coisas diferentes e ficam em lugares diferentes.

**Jornadas** deixa de ser módulo. Vira coleção.

---

## 12. UI

Lista de itens: nome, fornecedor, tipo, preço, margem, visibilidade, status. Chip de destaque em `medical_only`.

Detalhe do item: composição e cautelas em leitura, com origem indicada. Preço e visibilidade editáveis. Margem calculada quando há `cost`.

Lista de protocolos: nome, contagem de itens, preço, indicador de deriva quando diverge da soma, visibilidade, claim status, status.

Detalhe do protocolo: seleção de itens do catálogo (não criação), quantidade por item, preço com origem (`sum` ou `manual`) e ação de recalcular quando aplicável, seção de claims com estado em destaque, cautelas agregadas dos itens em leitura, e o conteúdo editorial de página do kit (`page_content`).

Coleções: árvore navegável quando há hierarquia, lista quando não há. Detalhe permite adicionar item e protocolo, com busca no catálogo. Mostrar contagem própria e contagem com rollup dos filhos separadamente, para não confundir o operador.

Seguir o DS da NAWA, visão light como padrão. Manter o padrão server-fetch → client-table e CRUD via Server Actions já estabelecido.

---

## 13. Auditoria

`saveItem`, `saveProtocol`, `deleteProtocol`, alterações de preço e ações de publish chamam `logAudit`, no mesmo padrão de assinaturas, chaves e usuários. Alteração de preço registra valor anterior e novo.

---

## 14. Migração

1. Criar `suppliers`. Popular com Botane e o parceiro de GLP-1. Criar fornecedor interno para serviços.
2. Renomear `formulas` para `items`.
3. Migrar `supplier` (enum) para `supplier_id` (fk). GLP-1 pode ter múltiplos fornecedores — mapear cada linha para o supplier correto, não assumir um único parceiro.
4. Criar `protocol_items` e popular a partir de `formulas.protocol_id`.
5. Migrar `dosage` para `composition` jsonb, preservando o texto original em `{ raw: "..." }`. Não parsear. Marcar para revisão no primeiro sync.
6. Adicionar colunas novas com defaults seguros: `visibility = 'medical_only'`, `claim_status = 'draft'`, `price_source = 'manual'`.
   - **`item_type` deriva de `is_glp1`**: linha com `is_glp1 = true` → `item_type = 'medicamento'`; demais → `'manipulado'`. Não usar default cego.
   - **Backfill de preço (bloqueador):** `item.price` vem de `commercial_products` (ref_type = 'formula') quando existir; onde não houver, a NAWA precifica antes de publicar (§6). `item.cost` fica nulo se o fornecedor não expõe. `protocol.price` é backfillado pela soma dos itens (`price_source = 'sum'`) ou pelo valor do produto comercial correspondente quando houver. `protocol.price` é `NOT NULL` — não deixar nulo.
7. Criar `collections` e `collection_members`. Migrar `attributes` de categoria para coleção. Migrar `journeys` para coleção de topo e os vínculos de jornada para `collection_members`.
8. Migrar `orders` e `subscriptions` para linhas (`order_lines` / `subscription_lines`) a partir da composição atual. **`plan_id` permanece** nas tabelas (é reorganizado para checkout, não removido — §11); as linhas complementam, não substituem, o vínculo de plano.
9. Depreciar `commercial_products`, `journeys`, `attributes` e `entity_attributes` se existirem. Manter por uma release para rollback. **`plans` não entra nesta lista** — é mantido e repropósito.
10. Remover `formulas.protocol_id`, `formulas.dosage`, `protocols.external_ref` e `orders.journey_id` após a release de transição. **Não remover `plan_id`.**

Default de visibilidade é `medical_only` de propósito. Falha fechada. Item sumir do storefront e alguém reclamar é melhor que item médico vazar.

---

## 15. Critérios de aceite

- Uma coleção sem `parent_id` funciona como categoria plana. Com `parent_id`, aparece como nó da árvore. Mesmo mecanismo.
- Uma coleção aceita item e protocolo como membros.
- Tentativa de criar ciclo em `collections` é rejeitada com erro amigável.
- Coleção pai lista os membros dos filhos na leitura, sem duplicar linha em `collection_members`.
- Um item pode existir sem pertencer a nenhum protocolo e ser vendido avulso.
- Um item pode pertencer a dois protocolos sem duplicação de linha.
- Criar protocolo com três itens define `price` como a soma e `price_source = 'sum'`.
- Editar o preço do protocolo define `price_source = 'manual'` e o valor permanece após mudança de preço de item.
- Divergência entre preço do protocolo e soma atual é exibida, sem bloquear publicação.
- Adicionar item `medical_only` a protocolo público força o protocolo para `medical_only`.
- `item_type = 'medicamento'` trava `visibility = 'medical_only'` na UI.
- Item `published` e `medical_only` não retorna na Storefront API. Teste automatizado.
- `claim_public` não é servido enquanto não aprovado. Teste automatizado.
- Campos de propriedade do fornecedor não são editáveis na UI para fornecedor externo.
- Pedido aceita linhas de tipo `item` e `protocol` no mesmo pedido.
- `plan_id` continua íntegro em `orders`/`subscriptions` após a migração.

---

## 16. Fora de escopo

- Motor de anamnese e regras de upsell. Esta spec entrega o catálogo que o motor vai consultar e o carrinho que ele vai montar. A inteligência em si é outra spec.
- Configuração de recorrência no checkout. Esta spec só declara que ela sai do catálogo e vai para lá; o plano é mantido e reorganizado nessa camada.
- Módulo de prescrição. O `protocol_versions` entrega o versionamento; o snapshot na prescrição fica para quando o módulo existir.
- **Fluxo de venda com telemedicina** (§17). Adiado por decisão do cliente.
- Decisão build vs buy do commerce engine (Shopify ou próprio). Esta arquitetura é agnóstica a isso de propósito.

---

## 17. Pontos abertos

- **Fluxo de telemedicina (adiado, 2026-07-17).** Existirão protocolos que só podem ser
  prescritos por médico e exigem apoio de teleconsulta para serem vendidos — um eixo de
  *fluxo de venda* ortogonal a `visibility`. Não modelado nesta spec. Quando entrar,
  provável campo tipo `sales_flow` (`direct | teleconsult`) e/ou `requires_prescription`
  em item e/ou protocolo, mais o fluxo de checkout correspondente.
- **RBAC de aprovação de claim.** Definir qual papel move `claim_status` de `draft` para
  `approved` (provavelmente médico). Ver §8.
- **Versionamento de protocolo.** Definir o gatilho de escrita de `protocol_versions`
  (assumido: snapshot no publish). Confirmar.
- Confirmar com o Silas que Core Premium e Full Personalizado deixam de existir como camada de dado. Não muda schema, mas muda o Golden Protocol, que hoje vende três camadas como estrutura para o Arbor, médicos e jurídico.
- Fórmula base de teste da Botane (pendência da ata de 14/07): validar se `composition` como jsonb representa fielmente o que a Botane entrega, e se ela expõe custo. Alinhar nomes de campo com a origem antes de fechar.
- Confirmar se a Botane tem construto de protocolo do lado dela. Esta spec assume que não e que protocolo é 100% autoral NAWA.
- Serviços (acompanhamento, consulta, análise de exames) como itens de fornecedor interno: confirmar se a operação enxerga assim ou se prefere entidade própria.

### Resolvidos nesta versão

- ~~Coleção guardar protocolo além de item~~ — **confirmado** (§5, §0). Coleção agrupa produtos e kits.
- ~~`plans` morre ou é reorganizado~~ — **reorganizado** para checkout, não removido (§0.1, §11).
- ~~De onde vem o preço do item na migração~~ — de `commercial_products`; se não houver, NAWA precifica (§0.3, §6, §14.6).
- ~~`item_type` do GLP-1 na migração~~ — deriva de `is_glp1`; GLP-1 é item comum com múltiplos fornecedores (§0.4, §14.6).
