# NAWA Backoffice — Especificação de Produto

> Documento de especificação para construção do painel administrativo da NAWA.
> Destinado a consumo direto por agente de código (Claude Code).
> Versão inicial. Sujeito a validação com o cliente e adaptação durante a construção.

---

## 1. Contexto

A NAWA é uma plataforma premium de saúde metabólica contínua. O produto digital opera em dois planos que precisam ser entendidos separadamente:

O **backoffice** (este documento) é a fonte da verdade. É onde a operação configura tudo: catálogo, protocolos, anamnese, jornadas, promoções, papéis de acesso e integrações. Nada de regra de negócio vive fora dele.

O **front** (paciente e área médica) é consumidor. Ele lê a configuração publicada pelo backoffice e renderiza. Não decide regra, não guarda taxonomia própria, não duplica lógica de negócio.

A relação é a mesma que o Shopify tem com a vitrine, ou que o painel do Spotify tem com o app. O admin é o cérebro. O front é a superfície.

Consequência prática: quando a NAWA quiser abrir uma jornada nova no futuro (longevidade, hormonal, performance), ninguém edita código do front. Alguém cria a jornada no backoffice e ela passa a existir. Isso é o que sustenta a evolução futura que o negócio pede.

---

## 2. Princípios de arquitetura

1. **Backoffice como fonte da verdade.** Toda configuração nasce e vive no admin.
2. **Front headless.** O front consome o catálogo publicado por uma Storefront API autenticada por chave. Não bate no banco direto e não replica regra.
3. **Dois apps separados.** Backoffice e front são projetos e deploys independentes. Isolamento é requisito de segurança por causa do dado clínico sensível.
4. **Publish model.** Configuração tem estado de rascunho e publicado. O front só enxerga o que está publicado. Isso permite ao cliente configurar sem quebrar a experiência ativa.
5. **Design System como padrão.** O DS da NAWA já construído governa tokens e componentes, com light como visão primária e dark suportado por acessibilidade.
6. **Segurança por padrão.** Least privilege, RLS, auditoria de dado sensível e reforço no pagamento não são opcionais.

---

## 3. Stack técnica

| Camada | Escolha | Observação |
|---|---|---|
| Framework | Next.js | App Router. Substitui a preferência anterior por Vite. |
| Componentes | MUI v6 | Temado pelo Design System NAWA. |
| Design tokens | Design System NAWA | Light-first. Dark disponível por acessibilidade. |
| Banco de dados | Supabase (Postgres) | Fonte de dados compartilhada com o front. |
| Autenticação | Supabase Auth | Contextos separados para admin e front. |
| Backend | Netlify Functions | Lógica server-side, webhooks, integrações. |
| IA | Anthropic + voyage-3 | Apenas se necessário. Backoffice é comercial. |
| Vetores | pgvector | Só se surgir necessidade real. Provavelmente não. |
| Deploy | Dois projetos independentes | Backoffice e front sobem separados. |

Nota de confirmação: o DS já construído define se a base de componentes é MUI v6 ou outra. Este spec assume MUI v6 por ser o padrão do estúdio. Ajustar se o DS divergir.

---

## 4. Modelo de domínio e taxonomia

Este é o ponto mais crítico do backoffice. A palavra "produto" está sobrecarregada na NAWA. O comercial diz produto e pensa em plano. O médico diz produto e pensa em fórmula. O operador da Botane diz produto e pensa no item que sai da produção. Se o schema não separar isso, o sistema fica impossível de configurar sem quebrar.

A NAWA tem **dois catálogos que se cruzam**, não um.

O **catálogo clínico** é o que o médico manipula: protocolos, fórmulas, formas farmacêuticas, prescription blocks, critérios de elegibilidade. É a linguagem da medicina metabólica.

O **catálogo comercial** é o que o paciente compra: planos, preço, recorrência, add-ons, promoções. É a linguagem do checkout.

O **GLP-1 é a ponte** entre os dois. Ele é um item prescritível no catálogo clínico (o médico decide) e um item cobrável no catálogo comercial (entra no valor do pedido), com fornecedor variável (magistral Botane ou original de parceiro) resolvido pelo sistema conforme o perfil.

### 4.1 Hierarquia de entidades

```
Jornada          container de mais alto nível (Metabolic Reset)
  └─ Plano       membership que o paciente assina (Start, Plus)

Protocolo        estrutura clínica prescrita pelo médico
  └─ Fórmula     unidade farmacotécnica real (item clínico)

Produto comercial   o que aparece no pedido e na cobrança
                    referencia uma Fórmula ou um Plano, carrega preço

Atributo         sistema de nomenclatura flexível que amarra tudo
                 equivalente aos metafields do Shopify
```

### 4.2 Definições

**Jornada** — container de experiência. Agrupa planos e define posicionamento. No MVP existe uma: Metabolic Reset. A estrutura nasce preparada para múltiplas jornadas, mas o MVP entrega uma só com profundidade.

**Plano** — o que o paciente assina. Tem preço base, recorrência e o que está incluso. Start e Plus são planos. O valor cobrado por ciclo pode variar conforme o que foi prescrito, então o plano define o piso, não o total fechado.

**Protocolo** — a estrutura clínica que o médico prescreve. Um protocolo contém uma ou mais fórmulas. Não é um produto único. Respeita lógica farmacotécnica real.

**Fórmula (item clínico)** — a unidade farmacotécnica real, com forma (cápsula, sachê, sublingual, tópico), dosagem e fornecedor. O GLP-1 é uma fórmula com atributo de origem (magistral ou original).

**Produto comercial** — o que entra no pedido e na cobrança. Referencia uma fórmula ou um plano e carrega o preço e a lógica de venda. É a face comercial do item clínico.

**Atributo** — o sistema de nomenclatura flexível. Tipo de forma, categoria metabólica, elegibilidade, tags de jornada. É o que dá a especificidade fina que o negócio precisa sem exigir mudança de schema a cada nova categoria.

### 4.3 Origem do catálogo

Ponto crítico de arquitetura: o catálogo clínico não nasce no backoffice. Ele nasce na Botane.

A Botane é o sistema de origem dos itens. Fórmulas, produtos manipulados e a estrutura farmacotécnica já existem e estão organizados lá. O backoffice importa esses itens, não os cria do zero. O que o backoffice faz é organizar, enriquecer com a taxonomia da NAWA e embrulhar comercialmente.

Isso divide os dois catálogos por origem:

O **catálogo clínico** (protocolos, fórmulas) tem origem na Botane. É importado e sincronizado. O backoffice mantém uma referência externa (`external_ref`) para cada item, ligando o registro NAWA ao registro Botane.

O **catálogo comercial** (jornadas, planos, produtos comerciais, preço, promoções) é autorado na NAWA, dentro do backoffice. Não existe na Botane.

O **produto comercial** é a ponte. Ele referencia uma fórmula importada da Botane e adiciona a camada de venda que só a NAWA tem.

A sincronização é o momento mais delicado da integração. Não se pode perder informação no caminho entre a Botane e o backoffice. Detalhado na seção 9.

---

## 5. Módulos do backoffice

### 5.1 Dashboard
Tela de entrada do backoffice. Dá o alcance rápido do estado da operação e os atalhos para o dia a dia. Deve conter uma visão resumida (pedidos recentes, assinaturas ativas, receita recorrente, pacientes aguardando avaliação médica, alertas de sincronização Botane) e links rápidos para as ações mais frequentes. Não é uma tela de análise profunda, é o ponto de partida que evita o operador entrar no sistema sem saber para onde ir.

### 5.2 Pedidos
Visão de todos os pedidos feitos, no padrão de um Shopify. Dois níveis:

Lista de pedidos. Tabela com todos os pedidos, mostrando paciente, plano, itens do catálogo, valor, status (pago, em produção, enviado, entregue, falho), fornecedor e data. Com filtro, busca e ordenação.

Detalhe do pedido. Página do pedido individual, com o resumo completo: paciente, jornada e plano, itens (fórmulas e produtos, incluindo GLP-1 e origem), protocolo e prescrição associados, valor e status de pagamento, status de produção na Botane, histórico do pedido e dados fiscais (a definir conforme seção 9.3).

Este módulo lê o resultado do fluxo de fulfillment. É onde a operação acompanha o que foi vendido e em que ponto cada pedido está.

### 5.3 Pacientes
Visão do paciente como pessoa, não como transação. Lista e detalhe. O detalhe reúne dados de cadastro, assinaturas, histórico de pedidos, anamnese respondida, protocolos e prescrições, e status clínico, num lugar só. É a contraparte do módulo de pedidos, com foco na pessoa. Dado clínico sensível, então acesso restrito por papel (seção 7) e sob auditoria (seção 8).

### 5.4 Assinaturas
Operação da recorrência depois de criada. Estado da assinatura (ativa, pausada, cancelada, inadimplente), upgrade, downgrade, pausa, cancelamento, retentativa de cobrança e acompanhamento de churn. É o coração do modelo de membership. Conecta com o catálogo (plano assinado) e com o pagamento (Pagar.me).

### 5.5 Catálogo
Gestão de planos e produtos comerciais. Preço, recorrência, inclusões, add-ons, estado de publicação. Referência para o checkout do front.

### 5.6 Protocolos (engine clínica)
CRUD de protocolos e fórmulas. Suporte a múltiplas fórmulas por protocolo, múltiplas formas farmacêuticas, prescription blocks configuráveis, critérios de elegibilidade por perfil da anamnese, fornecedor por fórmula (Botane ou parceiro). Este é o módulo mais estratégico e o que mais determina o schema.

### 5.7 Anamnese
Construtor de anamnese multi-step. Perguntas, lógica condicional, score de risco, geração de perfil metabólico, mapeamento de contraindicações. A anamnese configurada aqui é renderizada pelo front.

### 5.8 Jornadas
Gestão da jornada Metabolic Reset e estrutura para jornadas futuras. Define quais planos pertencem à jornada e o conteúdo associado.

### 5.9 Nomenclatura e atributos
Gestão da taxonomia. Criação e manutenção de atributos, categorias e tags que amarram catálogo, protocolos e jornadas. É o que garante consistência de linguagem entre médico, comercial e operação.

### 5.10 Promoções
Regras de preço, cupons, descontos por período. Aplicadas no checkout do front.

### 5.11 Sincronização Botane
Importação e sincronização dos itens vindos da Botane. Visualização do que foi importado, estado de sincronização por item, resolução de conflitos, log de sincronização. É a interface do momento delicado descrito na seção 9. Precisa deixar claro para o operador o que entrou, o que mudou e o que ficou pendente.

### 5.12 Chaves de API (Storefront)
Geração e gestão das chaves de API que o front usa para consumir o catálogo publicado. Permite criar, revogar e rotacionar chaves, com escopo de leitura. É por aqui que o storefront ganha acesso para rodar.

### 5.13 Configuração de sistema
Usuários internos, papéis, integrações (Pagar.me, eNotas, Hubspot, sistema Botane), parâmetros de ambiente.

### 5.14 Auditoria, RBAC e LGPD
Trilha de acesso e alteração de dado sensível, gestão de papéis, controles de conformidade. Detalhado na seção 8.

### Módulos de fase seguinte
Ficam mapeados agora, para construção posterior. Não bloqueiam o núcleo.

**Conteúdo.** Gestão do conteúdo que aparece na landing e na área do paciente. Como o front é headless, esse conteúdo é gerenciado no backoffice e servido pela Storefront API.

**Notificações.** Configuração de gatilhos e templates das comunicações de MVP (email, WhatsApp): onboarding, renovação, pedido enviado. Integra com o CRM (Hubspot).

**Observabilidade.** Visão consolidada de saúde do sistema: webhooks de pagamento que falharam, sync da Botane quebrado, erros de integração. Parte da base já vem do `botane_sync_log`, mas falta a visão unificada.

---

## 6. Modelo de dados (esboço)

Esquema inicial para orientar a implementação. Ajustar durante a construção.

```
journeys
  id, slug, name, status (draft|published), content, created_at, updated_at

plans
  id, journey_id (fk), slug, name, base_price, billing_interval,
  inclusions (jsonb), status, created_at, updated_at

protocols
  id, slug, name, clinical_description, external_ref (botane id),
  status, created_at, updated_at

formulas
  id, protocol_id (fk), name, pharmaceutical_form
  (capsule|sachet|sublingual|topical|other),
  dosage, supplier (botane|partner), is_glp1 (bool),
  external_ref (botane id), eligibility_rules (jsonb),
  synced_at, created_at, updated_at

commercial_products
  id, ref_type (plan|formula), ref_id, name, price,
  is_addon (bool), status, created_at, updated_at

attributes
  id, scope (catalog|protocol|journey), key, label, type,
  created_at, updated_at

entity_attributes
  id, attribute_id (fk), entity_type, entity_id, value

anamnesis_forms
  id, slug, name, status, created_at, updated_at

anamnesis_questions
  id, form_id (fk), order, type, label,
  conditional_logic (jsonb), risk_weight, created_at, updated_at

promotions
  id, code, type, value, valid_from, valid_to, status, created_at

orders
  id, patient_id, journey_id (fk), plan_id (fk),
  status (paid|in_production|shipped|delivered|failed),
  total, payment_status, prescription_id, botane_order_ref,
  created_at, updated_at

order_items
  id, order_id (fk), ref_type (plan|formula|product),
  ref_id, name, supplier (botane|partner), is_glp1 (bool),
  quantity, unit_price, created_at

patients
  id, auth_user_id (front user), name, email, phone,
  clinical_profile (jsonb), consent_status,
  created_at, updated_at

subscriptions
  id, patient_id (fk), plan_id (fk),
  status (active|paused|canceled|past_due),
  current_period_start, current_period_end,
  payment_provider_ref, created_at, updated_at

users_internal
  id, email, role, mfa_enabled, status, created_at, updated_at

audit_log
  id, actor_id, action, entity_type, entity_id,
  changes (jsonb), ip, created_at

api_keys
  id, name, key_hash, scope (read), status (active|revoked),
  last_used_at, created_by, created_at

botane_sync_log
  id, run_at, direction (import|order),
  status (success|partial|failed),
  items_processed, items_failed, details (jsonb)
```

Regra de ouro do publish model: front consulta apenas registros com `status = published`. Rascunho nunca vaza para o paciente.

---

## 7. Papéis e acesso (RBAC)

| Papel | Escopo |
|---|---|
| Super admin | Acesso total, gestão de usuários e integrações. |
| Admin de catálogo | Catálogo, jornadas, promoções, nomenclatura. Sem dado clínico. |
| Médico | Protocolos, fórmulas, elegibilidade, dado clínico. |
| Operador | Leitura de pedidos e status de produção. Escopo mínimo. |

Princípio de least privilege. Ninguém tem acesso a dado que não precisa para a função. O admin de catálogo, por exemplo, não enxerga dado clínico de paciente.

---

## 8. Segurança e LGPD

Requisito de primeira classe, não camada adicional. Plataforma clínica lida com dado sensível de saúde, que sob a LGPD (art. 11) exige proteção reforçada e consentimento explícito.

### 8.1 Autenticação e acesso
- Supabase Auth com contextos separados para admin e front. Um login de admin nunca é válido no front e vice-versa.
- MFA obrigatório para super admin e médico.
- Sessões com expiração e revogação.

### 8.2 Row Level Security
- RLS ativado em todas as tabelas com dado sensível.
- Políticas por papel, alinhadas ao RBAC da seção 7.
- Nenhuma query do front acessa tabela sem política explícita.

### 8.3 Auditoria
- Toda leitura e alteração de dado clínico registrada em `audit_log`.
- Registro imutável, retido para conformidade e relevante também para CFM.
- Log inclui ator, ação, entidade, mudança, IP e timestamp.

### 8.4 Criptografia
- Dado em trânsito sempre por TLS.
- Dado sensível em repouso protegido conforme capacidade do Supabase.
- Segredos (chaves de Pagar.me, Botane, parceiro GLP-1) apenas em variáveis de ambiente server-side. Nunca no cliente, nunca no repositório.

### 8.5 Pagamento (reforço específico)
Ponto de segurança mais forte do sistema, conforme direcionamento do produto.
- Dado de cartão nunca trafega nem é armazenado pela NAWA. Tokenização via Pagar.me.
- Toda operação de cobrança acontece server-side, em Netlify Functions. O front nunca chama a API de pagamento direto.
- Webhooks de pagamento validados por assinatura. Payload não confiável até verificação.
- Idempotência em criação de cobrança para evitar cobrança duplicada.
- Nenhum dado sensível de pagamento em URL, query string ou log.

### 8.6 LGPD e direitos do titular
- Consentimento explícito para tratamento de dado de saúde, registrado.
- Política de privacidade e termos publicados antes do soft launch.
- Procedimento de exclusão e portabilidade de dado do titular.
- Responsável por dado (DPO ou equivalente) definido.
- Retenção mínima necessária, sem acúmulo injustificado.

### 8.7 Chave de API do storefront
- Chave guardada como hash, nunca em texto puro.
- Escopo de leitura apenas. O front nunca escreve.
- Revogação e rotação disponíveis no backoffice.
- Uso registrado (`last_used_at`) para detectar chave comprometida ou ociosa.
- Endpoint valida a chave em toda requisição, antes de servir qualquer dado.

### 8.8 Integridade de prescrição
- Prescrição gerada não é editável após emissão. Correção gera nova versão, mantendo histórico.

---

## 9. Integrações

Duas integrações estruturam o sistema. A da Botane, que é bidirecional e delicada, e a do front, que consome o catálogo publicado por API.

### 9.1 Botane (bidirecional)

A Botane é o sistema de origem do catálogo clínico. A integração tem dois sentidos.

Entrada (Botane para NAWA): importação de itens, fórmulas e estrutura farmacotécnica. Cada item importado guarda um `external_ref` que aponta para o registro original na Botane. A sincronização é o momento mais sensível do sistema. Regras:
- Nada é sobrescrito silenciosamente. Mudança vinda da Botane que conflita com o que existe no backoffice é sinalizada, não aplicada às cegas.
- Toda sincronização gera registro em `botane_sync_log`, com o que entrou, o que mudou e o que falhou.
- Item importado nunca é editado de forma que quebre o vínculo com a origem. O backoffice enriquece por cima (taxonomia, camada comercial), não altera a fórmula em si.
- Falha parcial é visível. O operador precisa enxergar o que ficou pendente para não perder informação no caminho.

Saída (NAWA para Botane): o pedido gerado na jornada (anamnese, protocolo, prescrição) segue para a Botane para produção. Também registrado em `botane_sync_log` com direção `order`.

Confirmação pendente: o mecanismo exato (API da Botane, arquivo, fila) depende do que o sistema Botane expõe. Mapear no início, porque define o esforço desta integração.

### 9.2 Front via Storefront API

O front não bate direto no banco. Ele consome um contrato de leitura exposto pelo backoffice, autenticado por chave de API. Padrão de Storefront API.

- O backoffice gera a chave (módulo 5.8). A chave tem escopo de leitura e pode ser revogada ou rotacionada.
- O front usa a chave para consumir catálogo, jornadas, planos, anamnese e conteúdo publicados.
- Contrato de publicação: a API só serve registros com `status = published`. Rascunho nunca sai.
- Sem escrita pelo front. Só o backoffice escreve configuração. O front lê.
- Endpoints de leitura rodam em Netlify Functions, que validam a chave antes de responder.
- Mudança publicada no admin passa a ser servida pela API sem deploy do front.

Tudo que for construído no backoffice precisa ter representação de leitura nessa API. Se uma entidade existe no admin e não tem como ser consumida pelo front, ela está incompleta.

### 9.3 Fulfillment e emissão fiscal (em aberto)

Ponto deixado explicitamente em aberto para discussão. Precisa ser resolvido antes de fechar o fluxo de pedido e pagamento, porque muda quem recebe, quem fatura e como o dado circula.

A pergunta central: quem é o responsável fiscal pela venda, e portanto quem emite a nota.

Cenários em cima da mesa:
- NF pela NAWA. A NAWA vende assinatura e tratamento como serviço próprio, emite a nota pela aplicação (via eNotas), e a Botane cuida só do processamento e da produção do pedido. Fiscalmente a Botane é fornecedor, não vendedor final.
- NF pela Botane. A Botane fatura o item manipulado direto para o paciente e emite a nota do produto. A NAWA pode emitir à parte a nota do serviço de acompanhamento.
- Nota dividida. Produto faturado e emitido pela Botane, serviço faturado e emitido pela NAWA. Comum nesse tipo de operação, porém aumenta a complexidade do fulfillment e da conciliação.

Cada cenário afeta:
- quem recebe o pagamento e como o valor é repassado entre NAWA e Botane;
- se o eNotas é acionado pela nossa aplicação ou não;
- o desenho do fluxo de pedido na saída para a Botane (seção 9.1);
- a conciliação financeira e o repasse.

Enquanto não decidido, o fluxo de fulfillment de ponta a ponta (anamnese, protocolo, prescrição, orçamento, pagamento, produção, entrega) fica com essa lacuna marcada. Retomar quando a discussão fiscal acontecer.

---

## 10. Fora de escopo do backoffice (MVP)

Para evitar overengineering, conforme o briefing:
app nativo, rede social, comunidade complexa, marketplace de creators, white-label, gamificação avançada, IA proprietária avançada, recommendation engine sofisticada, marketplace médico, multi-tenant, prontuário enterprise completo.

---

## 11. Ordem de construção sugerida

1. Fundação: Next.js, Supabase, Supabase Auth, aplicação do Design System, RBAC base e RLS.
2. Nomenclatura e atributos: a taxonomia precede o catálogo, porque tudo se apoia nela.
3. Integração Botane (entrada): mapear a origem e trazer os itens para o backoffice cedo, porque o catálogo clínico depende disso. É o ponto delicado, então vale começar a olhar antes de precisar.
4. Catálogo: planos e produtos comerciais, referenciando os itens importados.
5. Protocolos e fórmulas: a engine clínica, incluindo a ponte do GLP-1.
6. Anamnese: construtor multi-step com lógica condicional.
7. Jornadas: amarração de Metabolic Reset.
8. Storefront API e gestão de chaves: o contrato que o front vai consumir.
9. Promoções.
10. Integração Botane (saída) e configuração de sistema.
11. Pacientes e assinaturas: dependem do fluxo de pedido e recorrência existirem para ganhar dados reais.
12. Pedidos e dashboard: leem o resultado dos módulos anteriores. Valem ser construídos cedo como casca com dados mockados para validar navegação com o cliente, e ligados aos dados reais conforme os módulos de origem ficam prontos.
13. Auditoria, reforço de LGPD e endurecimento de segurança, com atenção especial ao fluxo de pagamento e à chave de API.
14. Fase seguinte: conteúdo, notificações e observabilidade. Expandir conforme a operação amadurece.

---

## 12. Pontos abertos para validar com o cliente

- Nomenclatura interna: confirmar se o cliente já usa termos próprios para plano, protocolo e fórmula, para não criar dialeto novo.
- Integração Botane: automática via API ou manual por operador no MVP. Muda o esforço de operações.
- Emissão fiscal e fulfillment: quem é o responsável fiscal pela venda e quem emite a nota (NAWA, Botane ou nota dividida). Detalhado na seção 9.3. Afeta pagamento, repasse e o fluxo de pedido de ponta a ponta.
- Fornecimento do GLP-1 original: a NAWA intermedia a compra financeiramente ou apenas indica o parceiro.
- Assinatura digital de prescrição: definir provedor e lead time.