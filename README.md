# printhub-regional
Marketplace regional de produtos impressos em 3D com sistema de lotes coletivos.

Projeto Integrador — Engenharia de Software, UNIFIO. Ana Livia Caprioli (frontend) e Miguel Vita de Oliveira (backend).

## Estrutura

| Pasta | O que é |
|---|---|
| `frontend/` | Angular 21 + Angular Material |
| `backend/` | API REST: Node.js, Express, TypeScript, Prisma, PostgreSQL |
| `docs/api-contrato.md` | Contrato da API (campos, permissões, erros) |
| `render.yaml` | Configuração de publicação no Render |

## Rodar o sistema completo

Precisa de Node 20+ e Docker Desktop aberto. Use dois terminais.

**Terminal 1 — API** (detalhes em [`backend/README.md`](backend/README.md)):

```bash
cd backend
cp .env.example .env
npm install
docker compose up -d
npm run db:migrate
npm run db:seed
npm run dev
```

**Terminal 2 — site:**

```bash
cd frontend
npm install
npm start
```

Abra `http://localhost:4200`. A API fica em `http://localhost:3000/api` e a documentação em `http://localhost:3000/api/docs`.

Se o site mostrar uma versão antiga depois de mudar arquivos, pare o `npm start` (Ctrl+C) e rode de novo: no Windows o observador de arquivos às vezes não percebe a mudança.

## Usuários de teste

Senha de todos: `printhub123`

| Perfil | E-mail | Telas |
|---|---|---|
| Administrador | `admin@printhub.local` | Dashboard, Pontos, Usuários, Lotes |
| Produtor | `produtor.a@printhub.local` (também `.b` e `.c`) | Painel do produtor, Dashboard |
| Consumidor | `consumidor.a@printhub.local` (também `.b` e `.c`) | Catálogo, Meus pedidos |
| Atendente | `atendente.centro@printhub.local`, `atendente.bairro@printhub.local` | Ponto de retirada |

## Testes

```bash
cd backend && npm test        # 91 testes de integração da API
cd frontend && npm test       # 29 testes do Angular
```
