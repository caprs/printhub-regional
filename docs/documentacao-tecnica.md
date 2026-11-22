# Documentação técnica — PrintHub Regional

## Visão geral

O PrintHub Regional aproxima consumidores e produtores locais de peças fabricadas por impressão 3D. A aplicação oferece catálogo, pedidos, retirada em pontos cadastrados e consolidação de pedidos em lotes para dividir o custo de entrega.

## Tecnologias e arquitetura

- **Frontend:** Angular 21, TypeScript, SCSS, Angular Material e RxJS. O bootstrap é feito pelo `AppModule`; `AppRoutingModule` define a navegação e módulos por tela são carregados sob demanda. A saída é uma SPA estática, sem SSR e com `prerender` desativado.
- **Backend:** Node.js 20+, Express 5 e TypeScript. A API REST é separada por áreas em `backend/src/modules/`; Zod valida entradas, JWT autentica usuários, middleware verifica perfis, Helmet e CORS protegem a aplicação, e Swagger publica o contrato.
- **Persistência:** PostgreSQL acessado pelo Prisma 7 com adapter `pg`. A URL do banco é fornecida por `DATABASE_URL` no backend.
- **Integração:** serviços Angular usam `environment.apiUrl`; o interceptor adiciona o token JWT. `CORS_ORIGIN` aceita uma ou mais origens separadas por vírgula. Em desenvolvimento, a API aceita portas locais do `ng serve`.

## Entidades e relações

O esquema em `backend/prisma/schema.prisma` contém `User`, `Product`, `PickupPoint`, `Order`, `OrderItem`, `Batch`, `Review`, `OrderStatusHistory`, `AuditLog` e `PasswordResetToken`. Pedidos ligam consumidor, produtor, ponto de retirada e, opcionalmente, lote. Itens guardam quantidade e preço unitário no momento da compra. O diagrama com cardinalidades e atributos está em [diagrama-classes.md](diagrama-classes.md).

## Perfis e funcionalidades

- **CONSUMIDOR:** consulta catálogo, compra, acompanha pedidos e avalia produtos após o pedido.
- **PRODUTOR:** mantém produtos próprios e processa os pedidos destinados a si.
- **ATENDENTE:** recebe e processa retiradas no ponto associado.
- **ADMINISTRADOR:** gerencia pontos, usuários e consulta indicadores e auditoria.

As rotas frontend usam guards de perfil e endpoints protegidos repetem a autorização no backend. A interface existente contém cadastro/login/recuperação, catálogo e detalhes, carrinho, checkout, pedidos, painel de produtor, operação de retirada, lotes, dashboard e administração de pontos/usuários.

## Regras de negócio relevantes

- Valores monetários são persistidos em centavos inteiros (`*Cents`).
- O estoque é reservado ao criar o pedido e restaurado nas situações previstas nas regras do serviço de pedidos.
- Pedidos têm prazo de 48 horas para resposta do produtor; a rotina de manutenção processa vencimentos.
- Pedidos não são apagados fisicamente pela operação comum: cancelamento/recusa e histórico preservam o registro.
- Lotes podem fechar ao atingir três pedidos ou após sete dias. A taxa é dividida em centavos com distribuição determinística da sobra.
- Pontos e usuários podem ser desativados; exclusão física indiscriminada não é adequada para registros com referências ou histórico.
- Operações críticas registram auditoria.

## Execução local

Requisitos: Node.js 20 ou superior, npm e Docker Desktop (ou PostgreSQL local).

```powershell
# Terminal 1 — PostgreSQL e API
cd backend
Copy-Item .env.example .env
docker compose up -d
npm ci
npm run db:migrate
npm run db:seed
npm run dev

# Terminal 2 — SPA Angular
cd frontend
npm ci
npm start
```

O compose local publica PostgreSQL na porta 5433. Configure `DATABASE_URL` e `JWT_SECRET` em `backend/.env`; o exemplo serve para desenvolvimento, não produção. Configure o URL da API em `frontend/src/environments/environment.development.ts`. A aplicação abre em `http://localhost:4200` e a API em `http://localhost:3000/api`.

Para gerar artefatos de produção:

```powershell
cd frontend; npm run build
cd ..\backend; npm run build
```

## Dados e migrações

As migrações existentes estão em `backend/prisma/migrations/`. `npm run db:migrate` é para desenvolvimento. `npm run db:deploy` aplica migrações versionadas a um banco de produção; revise o SQL e faça backup conforme a política do ambiente antes de executá-lo. `npm run db:seed` recria dados de demonstração e não deve ser executado sobre dados de produção.

## Publicação

O blueprint existente em `render.yaml` descreve backend, site estático, PostgreSQL e rewrite para `index.html`. Os serviços ainda precisam ser criados e configurados pelo responsável; nenhum deploy foi feito. Veja [publicacao.md](publicacao.md) para as variáveis e etapas.

## Verificações desta revisão

- `npx ngc -p tsconfig.app.json` no frontend terminou sem mensagens de erro.
- `npm run build` passou antes da extração final das rotas para módulos lazy, mas ainda precisa ser repetido para medir o pacote final; a execução posterior fora do sandbox foi rejeitada.
- `npm run typecheck` no backend passou.
- `npx prisma validate` passou.
- Os testes backend não foram executados: a configuração confirma que eles limpam as tabelas do banco `printhub_test` antes de cada caso. O build de produção ainda precisa ser repetido após a extração dos módulos.
- O último build completo anterior à modularização lazy apresentou 884,75 kB iniciais; a medição final permanece pendente.
