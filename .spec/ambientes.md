# Ambientes

Estado atual e o caminho para separar desenvolvimento de produção.

## Onde estamos (01/09/2026)

Existe **um projeto Supabase só** (`fkhjkzvswkdubhxdhxas`, sa-east-1) e ele
atende tudo: o desenvolvimento local dos dois apps e os dois sites publicados no
Netlify.

Isso significa, na prática:

- `npm run dev` grava no mesmo banco que o ambiente publicado lê;
- `npm run seed:data` (80 pacientes, 600 pedidos) atinge esse banco;
- uma migration aplicada localmente já valeu para todo mundo;
- os *deploy previews* do Netlify herdam as mesmas variáveis.

Enquanto não há cliente real, o custo disso é baixo. O custo sobe no instante em
que houver — e a mudança leva minutos, então não há razão para deixar para
depois desse instante.

O código **já está pronto** para dois ambientes: nada aponta para um projeto
específico, tudo vem de variável. Falta só criar o projeto e trocar as
variáveis.

## Criar o staging

1. **Criar o projeto** no painel do Supabase, mesma região (`sa-east-1`), nome
   sugerido `nawa-staging`.

2. **Aplicar as migrations.** Pegue a connection string em
   *Project Settings → Database → Connection string (URI)* e:

   ```sh
   cd backoffice-nawa
   # Sem --yes é dry-run: imprime só o host do alvo, para você conferir.
   node scripts/db-migrate.mjs --db-url="postgresql://..."
   node scripts/db-migrate.mjs --db-url="postgresql://..." --yes
   ```

   A CLI do Supabase registra o que já foi aplicado, então repetir o comando é
   seguro — só o que falta roda.

3. **Apontar o desenvolvimento local para ele.** Nos dois `.env.local`, troque:

   | Variável | Onde |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | backoffice e frontoffice |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | backoffice e frontoffice |
   | `SUPABASE_SERVICE_ROLE_KEY` | backoffice |
   | `SUPABASE_DB_URL` | backoffice (só para os scripts) |

   São essas quatro. Nada no código muda.

4. **Semear.** Agora sim os seeds podem rodar à vontade:

   ```sh
   npm run seed:data && npm run seed:orders
   node scripts/create-internal-user.mjs voce@nawahealth.com.br <senha> super_admin --yes
   ```

5. **Deploy previews.** No painel do Netlify, em *Site configuration →
   Environment variables*, defina as variáveis do Supabase de staging com escopo
   *Deploy previews* e *Branch deploys*, mantendo as de produção só no escopo
   *Production*. Assim um preview deixa de escrever no banco que o ambiente
   publicado usa.

## Como o código distingue os ambientes

`src/lib/env.ts` decide o rigor pela variável `CONTEXT`, que o Netlify define
sozinho:

| `CONTEXT` | Comportamento |
|---|---|
| `production` | Toda configuração crítica é **obrigatória**. Faltou, o build falha. |
| `deploy-preview`, `branch-deploy` | Aceita ausências, avisa no log. |
| ausente (local) | Modo desenvolvimento: assume `stub`, avisa no console. |

O rigor vale só para o deploy de produção de propósito — quebrar o `npm run dev`
de quem acabou de clonar o repositório não protegeria ninguém.

## Migrations daqui em diante

A ordem passa a ser **staging primeiro, produção depois**:

```sh
node scripts/db-migrate.mjs --env=.env.local --yes        # staging
node scripts/db-migrate.mjs --db-url="<produção>" --yes   # produção
```

O dry-run imprime o host do alvo justamente para essa hora: é o momento em que
se confunde um banco com o outro.
