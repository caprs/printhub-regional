# PrintHub Regional — Backend

API REST em Node.js + Express + TypeScript + Prisma + PostgreSQL.
Contrato das rotas: [`../docs/api-contrato.md`](../docs/api-contrato.md).

## Rodar na sua máquina

Precisa de Node 20+ e Docker Desktop aberto.

```bash
cd backend
npm install
cp .env.example .env
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
| `npm test` | Roda os testes no banco `printhub_test` |
| `npm run typecheck` | Confere os tipos |
| `npm run db:migrate` | Cria/aplica migrations depois de mudar o `schema.prisma` |
| `npm run db:seed` | **Apaga tudo** e recria os dados de demonstração |
| `npm run build` / `npm start` | Build e execução de produção |

## Usuários de teste

Senha de todos: `printhub123`

- `admin@printhub.local`
- `produtor.a@printhub.local`, `produtor.b@...`, `produtor.c@...`
- `consumidor.a@printhub.local`, `consumidor.b@...`, `consumidor.c@...`
- `atendente.centro@printhub.local`, `atendente.bairro@...`

## Estrutura

```
prisma/schema.prisma   tabelas e relacionamentos
prisma/seed.ts         dados de demonstração
src/app.ts             montagem das rotas
src/modules/<área>/    rotas (validação) + service (regras)
src/lib/               erros, dinheiro, paginação, auditoria
src/middlewares/       autenticação, perfis, tratamento de erros
tests/                 testes de integração (Vitest + Supertest)
```

## Situação

| Área | Estado |
|---|---|
| Autenticação (cadastro, login, me, recuperação de senha) | Pronto |
| Produtos (lista com filtros, CRUD, produtos do produtor) | Pronto |
| Pontos de retirada | Pendente |
| Pedidos | Pendente |
| Lotes coletivos | Pendente |
| Recebimento e retirada | Pendente |
| Avaliações | Pendente |
| Dashboard, administração, logs | Pendente (os logs já são gravados) |
| Envio de e-mail na recuperação de senha | Pendente — o token aparece no log |
| Upload de imagem | Fora do MVP — imagem por URL |
| Deploy | Pendente |
