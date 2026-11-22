# Checklist de entrega — PrintHub Regional

**Atualização:** 22/11/2026. Status: **Concluído** (evidência observada), **Necessita validação** (ainda não demonstrado integralmente) ou **Pendente** (ação a realizar). A validação de uma funcionalidade não implica teste de todos os seus cenários de erro.

| Requisito | Status | Evidência / observação |
|---|---|---|
| Angular com `standalone: false` | Concluído | Componentes e módulos adequados ao padrão solicitado. |
| Organização em NgModules | Concluído | `AppModule`, `AppRoutingModule`, módulos por tela e build Angular concluído. |
| Roteamento Angular | Concluído | Navegação local e acesso ao site publicado testados. |
| SPA sem SSR e sem SSG | Concluído | `angular.json` com saída estática e `prerender: false`; build de produção aprovado. |
| Angular Material | Concluído | Utilizado na interface e em módulos compartilhados. |
| Quatro ou mais entidades relacionadas | Concluído | Dez modelos no `schema.prisma`; diagrama revisado. |
| CRUD de produtos | Concluído | Operações testadas localmente; cadastro e listagem também testados em produção. |
| CRUD de pontos de retirada | Concluído | Operações e desativação testadas localmente. |
| Fluxo de pedidos | Concluído | Carrinho, checkout e acompanhamento testados localmente e pedido confirmado em produção. Cancelamento/status substituem exclusão física comum. |
| CRUD administrativo de usuários | Necessita validação | Rotas e telas documentadas; execução manual completa do CRUD administrativo não foi confirmada nesta revisão. |
| Dashboard com pelo menos três KPIs | Concluído | Quatro indicadores conferidos localmente: total de pedidos, pedidos em andamento, produtos ativos e lotes coletivos. |
| Fluxo principal ponta a ponta | Concluído | Pedido criado e visualizado em “Meus pedidos” no ambiente publicado. |
| Autenticação e integração API | Concluído | Cadastro/login local, integração API e operação de produto/pedido em produção. |
| Autorização de todos os perfis | Necessita validação | Guards Angular e middleware backend existem; falta confirmação de todos os cenários de permissão em produção. |
| Rewrite SPA e artefato `index.html` | Concluído | Frontend estático publicado com roteamento configurado. |
| Backend usa porta e banco do ambiente | Concluído | Serviço publicado e integrado ao PostgreSQL Render. |
| Migrações do banco | Concluído | Duas migrações conferidas no ambiente local; deploy de produção configurado com `prisma migrate deploy` e persistência confirmada. |
| Publicação em nuvem | Concluído | Frontend, API e banco publicados no Render. |
| Testes funcionais frontend | Concluído | Cadastro, catálogo, carrinho, checkout, produtos, pontos e dashboard testados localmente. |
| Testes automatizados backend/frontend | Necessita validação | Não foi apresentada nesta revisão saída atual das suítes; executar em banco de testes isolado antes de declarar contagem final. |
| Build Angular final | Concluído | `npm run build` passou; bundle inicial de 758,67 kB, com aviso de orçamento. |
| Build e typecheck backend | Concluído | `npm run build` e `npm run typecheck` passaram. |
| Validação Prisma | Concluído | `npx prisma validate` passou na revisão técnica anterior. |
| Documentação técnica e diagrama | Concluído | Arquivos Markdown revisados conforme informações fornecidas e `schema.prisma`. |
| Guia de publicação | Concluído | Atualizado com os endereços e a configuração do Render. |
| Commit e push das correções de URL | Concluído | Commit `0ba2694` publicado na branch `main`. |
| Commit e push desta revisão documental | Pendente | Os arquivos revisados precisam ser copiados para `docs/`, conferidos e enviados ao GitHub. |

## Links de entrega

- **Aplicação:** https://printhub-web-4kmp.onrender.com
- **API:** https://printhub-api-7wby.onrender.com/api
- **Repositório:** https://github.com/caprs/printhub-regional
- **Documentação:** pasta `docs/` no repositório.

## Pendências antes de enviar ao professor

1. Substituir os quatro arquivos na pasta `docs/` e verificar o diagrama Mermaid renderizado no GitHub.
2. Fazer commit e push da documentação revisada.
3. Se o professor exigir evidência de testes automatizados, executar as suítes em ambiente isolado e registrar a saída real.
4. Conferir requisitos específicos do enunciado e anexar evidências ou capturas solicitadas, se houver.
