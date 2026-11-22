# Guia de publicação

Este guia descreve a configuração necessária. Não cria recursos, não aplica migrações e não publica o sistema. O repositório já contém um blueprint de referência em `render.yaml`; reveja nomes, disponibilidade, políticas de retenção e preços diretamente no provedor antes de escolher uma hospedagem.

## Componentes

1. **Frontend:** publicar os arquivos estáticos gerados pelo Angular em `frontend/dist/frontend/browser`. O build precisa produzir `index.html`; configurar fallback/rewrite de todas as rotas não-arquivo para `/index.html` para que URLs como `/produto/12` sejam resolvidas pelo Angular.
2. **Backend:** executar o serviço Node/Express construído em `backend/dist/server.js`. A plataforma precisa permitir definir `PORT`, expor `/api/health` e manter o processo ativo.
3. **Banco:** PostgreSQL persistente e acessível pelo serviço backend. Não use o banco efêmero de teste.

## Variáveis

| Variável | Serviço | Uso |
|---|---|---|
| `NODE_ENV=production` | Backend | Habilita regras de produção e proxy confiável. |
| `PORT` | Backend | Porta atribuída pelo ambiente; se omitida, o código usa 3000. |
| `DATABASE_URL` | Backend e comandos de migração | String PostgreSQL fornecida pelo provedor, com TLS/parâmetros exigidos pelo serviço. |
| `JWT_SECRET` | Backend | Segredo aleatório próprio, com pelo menos 32 caracteres; nunca reutilize o valor de exemplo. |
| `CORS_ORIGIN` | Backend | Origem pública exata do frontend; múltiplas origens separadas por vírgula. |
| API URL de produção | Frontend | Definida em `frontend/src/environments/environment.ts`; deve corresponder à URL HTTPS pública da API. |

Não coloque `DATABASE_URL`, `JWT_SECRET` ou senhas no frontend, no Git ou em arquivos publicados. Cadastre segredos pelo painel do provedor.

## Passos

1. Escolha serviços que atendam a persistência, requisitos de disponibilidade, orçamento e região. Confirme limites e política de retenção vigentes com o provedor.
2. Crie um PostgreSQL persistente e obtenha a URL privada/recomendada para a conexão backend.
3. Configure as variáveis do backend e valide `/api/health` após iniciar o serviço.
4. Revise as migrações versionadas em `backend/prisma/migrations/` e faça backup do banco. Depois de aprovado, aplique `npm run db:deploy` no pipeline ou comando de release do backend. Não use `db:seed` em produção.
5. Configure `frontend/src/environments/environment.ts` com a URL pública HTTPS da API e gere os artefatos com `npm ci` e `npm run build` em `frontend/`.
6. Publique o conteúdo de `frontend/dist/frontend/browser` como SPA e configure o rewrite para `/index.html`.
7. Configure `CORS_ORIGIN` com a origem efetivamente publicada do site, sem barra final, e reinicie o backend.
8. Valide login, catálogo, checkout, atualização de status, acesso aos perfis e recuperação de senha em ambiente de homologação. Não marque o fluxo como aprovado sem executá-lo.

## Observações sobre o blueprint existente

`render.yaml` configura API, site estático e banco. O backend executa `prisma migrate deploy` no comando de build existente; antes de ativar esse blueprint, confirme que as migrações e a estratégia de backup estão revisadas. O fallback foi ajustado para `/index.html`, coerente com a SPA sem pré-renderização. O plano/limites dos recursos devem ser revisados na data da publicação.
