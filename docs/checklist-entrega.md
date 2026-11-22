# Checklist da entrega

Status usados: **Concluído**, **Pendente** e **Necessita validação**. “Concluído” significa que há evidência no código ou em comando observado; não implica validação visual/integrada da interface.

| Requisito | Status | Evidência / observação |
|---|---|---|
| Angular com `standalone: false` | Concluído | `frontend/src/app/app.ts`, `frontend/src/app/layout/header/header.ts` e componentes em `frontend/src/app/pages/` declaram explicitamente a opção. |
| Organização em NgModules | Necessita validação | `app.module.ts`, `app-routing.module.ts`, `shared/shared.module.ts` e módulos lazy por página; `npx ngc -p tsconfig.app.json` terminou sem erro, build final pendente. |
| Roteamento | Necessita validação | `app.routes.ts`, guards e módulos lazy; build e navegação manual pós-conversão ainda precisam ser conferidos. |
| SPA sem SSR e sem SSG | Necessita validação | `angular.json` define saída `static`, `prerender: false`, sem entradas de servidor; fontes SSR e dependências removidas. Confirmar após build final. |
| Angular Material usado na interface | Concluído | Componentes Material aparecem nas telas e `shared/shared.module.ts` fornece módulos usados. |
| Quatro ou mais entidades relacionadas | Concluído | `schema.prisma` contém dez modelos com chaves e relações. Diagrama: `diagrama-classes.md`. |
| CRUD de produtos pela interface | Necessita validação | `pages/painel-produtor/`, `modules/products/`; confirmar cenários na UI. |
| CRUD de pontos pela interface | Necessita validação | `pages/gerenciar-pontos/`, rotas `pickup-points`; desativação preserva referências. |
| CRUD/fluxo de pedidos | Necessita validação | `pages/checkout/`, `pages/meus-pedidos/`, `pages/painel-produtor/`, `pages/ponto-retirada/`; pedido usa cancelamento/status/histórico em vez de exclusão física. |
| CRUD administrativo de usuários | Necessita validação | `pages/administracao/`, `/api/admin/users`; criação, edição de perfil e ativação/desativação. |
| Dashboard baseado em dados reais | Concluído | `admin.service.ts` agrega pedidos, produtos, pontos, lotes e itens no Prisma; `pages/dashboard/` exibe indicadores e listas. |
| Fluxo principal completo pela interface | Necessita validação | Rotas e telas existem para cadastro, catálogo, carrinho, checkout, pedidos e operação; não houve execução manual ponta a ponta. |
| Autenticação, autorização e integração API | Concluído | `auth.interceptor.ts`, `perfil.guard.ts`, middleware backend e serviços HTTP; `environment.ts` aponta para a URL de API de produção configurada no projeto. |
| Configuração sem SSR/SSG e fallback SPA | Necessita validação | `angular.json` e `render.yaml` (rewrite para `/index.html`); confirmar artefato `index.html` no build atual. |
| Backend usa porta e banco do ambiente | Concluído | `config/env.ts` valida `PORT` e `DATABASE_URL`; `prisma.config.ts` usa a URL do ambiente. |
| Migrações existentes validadas | Concluído | `npx prisma validate` passou; nenhuma migração foi executada nesta revisão. |
| Publicação em nuvem | Pendente | Blueprint e passos descritos; nenhum serviço foi criado ou publicado. |
| Testes backend | Pendente | Não executados porque `tests/helpers.ts` limpa tabelas do banco `printhub_test`; validar que esse banco pode ser descartado antes de rodar. |
| Testes frontend e navegação real | Pendente | Não executados. |
| Build Angular e tamanho de bundle final | Pendente | Build anterior à extração lazy passou em 884,75 kB iniciais. Build final foi tentado, mas a solicitação de execução fora do sandbox foi rejeitada. |
| Typecheck backend | Concluído | `npm run typecheck` passou. |
| Validação Prisma | Concluído | `npx prisma validate` passou. |
| Publicação, commit, push ou alteração remota | Pendente | Nenhuma dessas ações foi realizada. |
