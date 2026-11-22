# Documentação técnica — PrintHub Regional

## Visão geral

O PrintHub Regional é um marketplace regional de produtos fabricados por impressão 3D. Conecta consumidores, produtores e pontos de retirada, centralizando catálogo, pedidos, acompanhamento e agrupamento de entregas em lotes com divisão de custos.

## Tecnologias e arquitetura

- **Frontend:** Angular 21, TypeScript, SCSS, Angular Material e RxJS. A aplicação usa `AppModule`, `AppRoutingModule`, NgModules por funcionalidade e carregamento sob demanda. É uma SPA estática, sem SSR ou SSG.
- **Backend:** Node.js, Express 5 e TypeScript. API REST organizada em `backend/src/modules/`, com validação Zod, autenticação JWT, autorização por perfil, Helmet, CORS e documentação Swagger.
- **Persistência:** PostgreSQL, Prisma 7 e adaptador `pg`. A conexão é definida por `DATABASE_URL` no backend.
- **Integração:** serviços Angular usam `environment.apiUrl`; o interceptor de autenticação envia o JWT. O backend restringe origens por `CORS_ORIGIN` em produção.

### Arquitetura simplificada

```text
Navegador → SPA Angular (Render Static Site)
                  ↓ HTTPS / JSON
             API REST (Render Web Service)
                  ↓ Prisma
             PostgreSQL (Render)
```

## Modelo de dados

O arquivo `backend/prisma/schema.prisma` define dez modelos: `User`, `Product`, `PickupPoint`, `Order`, `OrderItem`, `Batch`, `Review`, `OrderStatusHistory`, `AuditLog` e `PasswordResetToken`.

- `User` representa os perfis de acesso e relaciona-se a produtos, pedidos, avaliações e registros de operação.
- `Product` pertence a um produtor; `Order` identifica consumidor, produtor e ponto de retirada.
- `OrderItem` associa produtos aos pedidos e preserva quantidade e preço unitário no momento da compra.
- `Batch` reúne pedidos de um ponto de retirada. A associação de um pedido a um lote é opcional.
- `Review`, `OrderStatusHistory`, `AuditLog` e `PasswordResetToken` dão suporte a avaliações, rastreabilidade, auditoria e recuperação de acesso.

Consulte [`diagrama-classes.md`](diagrama-classes.md) para atributos e cardinalidades. Valores monetários são armazenados em centavos inteiros.

## Perfis e funcionalidades

- **Consumidor:** cadastro e login, consulta ao catálogo, carrinho, checkout, acompanhamento de pedidos e avaliações conforme as regras do sistema.
- **Produtor:** manutenção de produtos e gestão de pedidos recebidos.
- **Atendente:** recebimento e confirmação de retiradas no ponto associado.
- **Administrador:** administração de usuários e pontos de retirada, indicadores e recursos de auditoria.

As rotas Angular possuem controles de acesso por perfil; a API também verifica autenticação e autorização. As telas incluem catálogo, detalhes, carrinho, checkout, meus pedidos, painel do produtor, pontos de retirada, lotes, dashboard e administração.

## Regras de negócio

- Estoque é reservado na criação do pedido e restaurado nas situações de cancelamento ou recusa previstas pelo serviço.
- O produtor tem prazo de 48 horas para responder ao pedido; uma rotina processa vencimentos.
- O pedido mantém seu histórico de status em vez de ser excluído fisicamente na operação comum.
- Lotes são organizados por ponto de retirada e podem fechar ao atingir três pedidos ou após sete dias.
- O custo da entrega é dividido em centavos entre os pedidos do lote, com distribuição determinística de eventuais centavos restantes.
- Usuários e pontos podem ser desativados para preservar vínculos e histórico.
- Operações críticas podem gerar registros de auditoria.

As regras acima descrevem o comportamento documentado no projeto; para detalhes de exceções e transições, consultar os serviços do backend.

## Execução local

**Pré-requisitos:** Node.js compatível com o projeto, npm, Docker Desktop ou PostgreSQL local.

Terminal 1 — banco e backend, partindo da raiz do repositório:

```powershell
cd backend
Copy-Item .env.example .env
# Configure DATABASE_URL e JWT_SECRET no .env
# Inicie o Docker Desktop antes do comando abaixo
docker compose up -d
npm ci
npm run db:migrate
npm run db:seed
npm run dev
```

> `db:seed` destina-se somente ao ambiente de desenvolvimento. Confirme as configurações do `.env` antes de executar comandos que alteram o banco.

Terminal 2 — frontend, partindo da raiz do repositório:

```powershell
cd frontend
npm ci
npm start
```

- Frontend local: http://localhost:4200
- API local: http://localhost:3000/api
- Swagger local: http://localhost:3000/api/docs

O Docker Compose local utiliza a porta 5433 para PostgreSQL. A URL da API de desenvolvimento fica em `frontend/src/environments/environment.development.ts`.

Para compilar, execute `npm run build` separadamente nas pastas `frontend` e `backend`.

## Migrações e dados

As migrações estão em `backend/prisma/migrations/`. Para desenvolvimento, use o script `db:migrate` conforme o `package.json`; para produção, o blueprint executa `npx prisma migrate deploy`. O banco de produção é separado do PostgreSQL local. **Não execute o seed de demonstração em produção.** Antes de operações destrutivas, revise o SQL e as condições de backup/recuperação disponíveis.

## Publicação em produção

O sistema está publicado no Render:

- **Aplicação:** https://printhub-web-4kmp.onrender.com
- **API:** https://printhub-api-7wby.onrender.com/api
- **Swagger:** https://printhub-api-7wby.onrender.com/api/docs
- **Health check configurado:** https://printhub-api-7wby.onrender.com/api/health
- **Repositório:** https://github.com/caprs/printhub-regional

O `render.yaml` configura frontend estático, API Node e banco PostgreSQL, incluindo rewrite de rotas da SPA para `/index.html`. O frontend usa a URL pública da API, e o backend configura CORS para a origem publicada. Veja [`publicacao.md`](publicacao.md).

## Verificações e testes

**Compilações verificadas:** `npm run build` no frontend e backend; `npm run typecheck` no backend. O build final do Angular passou com bundle inicial de aproximadamente **758,67 kB**, com aviso de orçamento de tamanho, sem impedir a compilação. O banco local apresentava duas migrações aplicadas.

**Testes funcionais locais relatados:** cadastro/login, catálogo, carrinho, checkout, pedidos, CRUD de produtos, CRUD de pontos de retirada e dashboard com quatro indicadores (total de pedidos, pedidos em andamento, produtos ativos e lotes coletivos). Os indicadores foram conferidos contra registros e permaneceram após atualização da página.

**Testes em produção confirmados:** acesso à aplicação publicada, resposta da API de produtos, cadastro de produto com exibição no catálogo e conclusão de pedido com visualização em “Meus pedidos”. Esses testes confirmam os fluxos verificados, mas não equivalem à validação de todas as permissões, rotinas automáticas e cenários de exceção.

**Testes automatizados:** os arquivos fornecidos nesta revisão não incluem a saída de uma execução atual das suítes; portanto, nenhuma contagem de testes é declarada como validada nesta etapa.
