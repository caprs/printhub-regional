# PrintHub Regional — Backend

API REST em Node.js + Express + TypeScript + Prisma + PostgreSQL.

- Contrato das rotas (para o frontend): [`../docs/api-contrato.md`](../docs/api-contrato.md)
- Documentação interativa: `http://localhost:3000/api/docs`

## Rodar na sua máquina

Precisa de Node 20+ e Docker Desktop aberto.

```bash
cd backend
cp .env.example .env
npm install
docker compose up -d
npm run db:migrate
npm run db:seed
npm run dev
```

A API fica em `http://localhost:3000/api`. Teste: `http://localhost:3000/api/health`.

O banco roda na porta **5433** (para não conflitar com um PostgreSQL instalado).

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe a API e reinicia ao salvar |
| `npm test` | Roda os 91 testes no banco `printhub_test` |
| `npm run typecheck` | Confere os tipos |
| `npm run db:migrate` | Cria/aplica migrations depois de mudar o `schema.prisma` |
| `npm run db:seed` | **Apaga tudo** e recria os dados de demonstração |
| `npm run build` / `npm start` | Build e execução de produção |

## Usuários de teste

Senha de todos: `printhub123`

| Perfil | E-mail |
|---|---|
| Administrador | `admin@printhub.local` |
| Produtor | `produtor.a@printhub.local`, `produtor.b@...`, `produtor.c@...` |
| Consumidor | `consumidor.a@printhub.local`, `consumidor.b@...`, `consumidor.c@...` |
| Atendente | `atendente.centro@printhub.local`, `atendente.bairro@...` |

O seed também cria 6 pedidos e 2 lotes, um em cada situação. A lista está no contrato (seção 11).

## Estrutura

```
prisma/schema.prisma      tabelas e relacionamentos
prisma/seed.ts            dados de demonstração
src/app.ts                montagem das rotas
src/modules/<área>/       rotas (validação) + service (regras)
src/modules/batches/batch-rules.ts   regras dos lotes e da taxa
src/modules/maintenance.ts           prazos de 48 h e de 7 dias
src/lib/                  erros, dinheiro, paginação, auditoria
src/middlewares/          autenticação, perfis, tratamento de erros
src/docs/openapi.ts       Swagger
tests/                    testes de integração (Vitest + Supertest)
```

## Como as regras principais funcionam

| Regra | Onde |
|---|---|
| Estoque reservado ao criar o pedido; volta se recusar, cancelar ou expirar (RN03) | `orders.service.ts` → `create`, `restoreStock` |
| 48 h para o produtor responder (RN04) | `expireOverdueOrders`, roda a cada minuto e antes das rotas de pedido |
| Lote fecha com 3 pedidos ou 7 dias (RN06) | `batch-rules.ts` → `closeBatch` |
| Taxa dividida em centavos, sobra para os primeiros (RN15/RN16) | `money.ts` → `splitCents` |
| Dois aceites ao mesmo tempo não colocam 4 pedidos num lote | `lockPickupPoint` (bloqueio da linha do ponto no PostgreSQL) |
| Toda operação crítica registrada | `audit.ts` → tabela `audit_logs` |

## Publicar (deploy)

O arquivo `render.yaml` na raiz do repositório configura API + banco no Render (plano gratuito).

1. Crie uma conta em render.com e conecte o GitHub.
2. **New → Blueprint** → escolha o repositório `printhub-regional`.
3. Preencha `CORS_ORIGIN` com o endereço público do Angular.
4. Depois do primeiro deploy, carregue os dados de demonstração a partir da sua máquina:

```bash
DATABASE_URL="<External Database URL do Render>" npm run db:seed
```

Observações:
- No plano gratuito a API "dorme" após 15 min sem uso; a primeira requisição leva ~1 min. Abra a API antes da apresentação.
- O banco gratuito do Render expira em 30 dias. Para a entrega de 01/11 isso basta.

## Situação

| Área | Estado |
|---|---|
| Autenticação, recuperação de senha, perfis | Pronto e testado |
| Produtos com filtros e paginação | Pronto e testado |
| Pontos de retirada | Pronto e testado |
| Pedidos, aceite/recusa, prazo de 48 h, cancelamento | Pronto e testado |
| Lotes coletivos e taxa de entrega | Pronto e testado |
| Recebimento e retirada no ponto | Pronto e testado |
| Avaliações | Pronto e testado |
| Dashboard, usuários, logs de auditoria | Pronto e testado |
| Documentação Swagger | Pronto |
| Configuração de deploy | Pronto — falta criar a conta e publicar |
| Envio de e-mail na recuperação de senha | **Pendente** — o token aparece no log/resposta em desenvolvimento |
| Upload de imagem | **Fora do MVP** — imagem por URL |
