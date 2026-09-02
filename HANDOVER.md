# Handover — Plataforma NAWA

Ponto de entrada para quem está assumindo o sistema. Atualizado em **02/09/2026**.

Estado: backoffice `9e01009`, frontoffice `a0f2ecf`, `dev` == `main` == `origin` nos
dois. Ambiente publicado e verificado, em **desenvolvimento** — sem cliente real,
pagamento em sandbox.

---

## Comece por aqui

1. **Leia o [documento de transferência técnica](https://claude.ai/code/artifact/4de4585a-e2ea-424d-9b20-2e3f5bb0a84e)** — stack e o porquê de cada
   peça, doze decisões de arquitetura registradas, o fluxo de receita ponta a ponta,
   segurança, desempenho medido, operação, pendências e próximos passos.
2. **Percorra o funil inteiro localmente** antes de mudar qualquer coisa: anamnese →
   carrinho → checkout → aprovação clínica. Três defeitos na história deste projeto
   passaram por typecheck e build limpos e só apareceram ao exercitar o sistema.
3. **Depois** leia a [auditoria de arquitetura](https://claude.ai/code/artifact/4185b240-b6e8-4c06-83b9-1c0a5bc6bba0), que traz o diagnóstico de 01/09 com a
   situação de cada achado.

O [mapa navegável da arquitetura](https://claude.ai/code/artifact/9c654635-b93c-4b03-b238-23364b1c2b60) complementa os três: mostra cada bloco da
plataforma com status, dependências e o fluxo do pedido ponta a ponta.

## Os dois repositórios

| Repositório | Papel |
|---|---|
| [`nawa-admin`](https://github.com/Loudr-com-br/nawa-admin) | Backoffice — painel administrativo **e a API do produto** |
| [`nawa-frontoffice`](https://github.com/Loudr-com-br/nawa-frontoffice) | Loja headless, checkout e painel do paciente |

A loja não fala com o banco: fala com a API do backoffice, autenticada por chave.
Um único sistema tem acesso ao Postgres, e essa decisão sustenta o resto.

## Documentação

| Onde | O quê |
|---|---|
| [`README.md`](README.md) | Setup, comandos, qualidade, banco, configuração |
| [`.spec/spec.md`](.spec/spec.md) | Especificação de produto — fonte da verdade |
| [`.spec/plan.md`](.spec/plan.md) | Plano vivo: o que está feito, o que falta e por quê |
| [`.spec/ambientes.md`](.spec/ambientes.md) | Ambientes, rigor de configuração, como criar o staging |
| [`.spec/arquitetura.html`](.spec/arquitetura.html) | Mapa visual navegável da plataforma — [versão publicada](https://claude.ai/code/artifact/9c654635-b93c-4b03-b238-23364b1c2b60) |
| [`.spec/storefront-api.md`](.spec/storefront-api.md) | Contrato da Storefront API |
| [`.spec/api-boundary.md`](https://github.com/Loudr-com-br/nawa-frontoffice/blob/main/.spec/api-boundary.md) | Fronteira de API (no repo do front) — reservar uma semana antes do lançamento |

## Contas e serviços

| Serviço | Para quê | Onde confirmar |
|---|---|---|
| GitHub (`Loudr-com-br`) | Código e CI | Acesso aos dois repositórios |
| Netlify | Hospedagem, CDN, variáveis de ambiente | Sites `nawahealth` e `nawa-storefront` |
| Supabase | Postgres, Auth, Storage — projeto `Nawa DB`, região `sa-east-1` | **Confirmar plano e política de backup** |
| Pagar.me | Pagamento, hoje em sandbox | **Cadastro do webhook pendente — ver abaixo** |

## O que fazer primeiro

1. **Cadastrar o webhook no painel do Pagar.me.** URL
   `https://nawahealth.netlify.app/api/payments/webhook`, HTTP Basic, usuário `nawa`,
   senha em `npx netlify env:get PAGARME_WEBHOOK_PASSWORD`. Sem isso a cobrança
   autoriza mas a confirmação volta 401 e o pedido não avança — é o que vai travar o
   primeiro teste de quem assumir.
2. **Criar o Supabase de staging.** Hoje o desenvolvimento local grava no mesmo banco
   que o ambiente publicado lê. O código já suporta dois ambientes; é trocar quatro
   variáveis e rodar um comando. Passo a passo em [`.spec/ambientes.md`](.spec/ambientes.md).
3. **Confirmar plano e backup do Supabase.** Dado clínico com backup apenas diário é
   risco desproporcional ao custo de corrigir.
4. **Rastreio de erro e alerta.** Único item da auditoria sem endereçamento: hoje uma
   falha em pagamento, webhook ou captura só aparece por reclamação.
5. **SMTP próprio no Supabase Auth.** O servidor compartilhado limita envios por hora e
   trava o cadastro real de cliente. Bloqueador silencioso de lançamento.

## Como o trabalho flui

```
dev  →  CI (tipos · lint · testes · auditoria · build)
main →  Netlify publica  →  smoke verifica o que subiu
```

Rollback é restaurar a publicação anterior pelo painel do Netlify, em segundos.
**Isso não desfaz migration** — por isso as migrations são aditivas por padrão.
