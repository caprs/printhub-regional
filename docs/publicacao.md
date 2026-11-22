# Guia de publicação — PrintHub Regional

## Situação atual

O PrintHub Regional **já foi publicado no Render** e teve seus fluxos básicos de produto e pedido testados em produção. Este documento registra a configuração adotada e orienta futuras atualizações; não executa alterações nos serviços.

## Serviços e endereços

| Componente | Serviço Render | Endereço / configuração |
|---|---|---|
| Frontend | `printhub-web` — Static Site | https://printhub-web-4kmp.onrender.com |
| Backend | `printhub-api` — Web Service | https://printhub-api-7wby.onrender.com |
| API REST | Backend | https://printhub-api-7wby.onrender.com/api |
| Swagger | Backend | https://printhub-api-7wby.onrender.com/api/docs |
| Health check | Backend | `/api/health` |
| PostgreSQL | `printhub-db` | Conexão privada via `DATABASE_URL` |

Os recursos foram criados a partir do blueprint `render.yaml` do repositório. O banco Render é independente do banco PostgreSQL usado localmente no Docker.

## Configuração do frontend

- Diretório raiz do serviço: `frontend`.
- Build: `npm ci && npm run build`.
- Diretório publicado: `dist/frontend/browser`.
- Rewrite de `/*` para `/index.html` para permitir acesso direto às rotas Angular.
- URL de produção da API em `frontend/src/environments/environment.ts`: `https://printhub-api-7wby.onrender.com/api`.
- SPA estática, sem renderização no servidor.

## Configuração do backend

- Diretório raiz do serviço: `backend`.
- Build configurado no blueprint: `npm ci --include=dev && npm run build && npx prisma migrate deploy`.
- Inicialização: `npm start` (executa o servidor compilado).
- Health check: `/api/health`.
- A porta é atribuída pelo ambiente de hospedagem; não é necessário expor localmente a porta 3000.

### Variáveis de ambiente

| Variável | Finalidade |
|---|---|
| `NODE_ENV=production` | Habilita configuração de produção |
| `PORT` | Porta fornecida pelo ambiente, quando aplicável |
| `DATABASE_URL` | Conexão PostgreSQL fornecida pelo serviço de banco |
| `JWT_SECRET` | Segredo de autenticação gerado e armazenado no provedor |
| `CORS_ORIGIN` | `https://printhub-web-4kmp.onrender.com` |

**Segurança:** nunca adicionar `DATABASE_URL`, `JWT_SECRET`, senhas ou tokens ao Git, ao frontend ou à documentação. O `JWT_SECRET` deve ser gerenciado no painel do Render.

## Atualização de versão

1. Verifique se as alterações funcionam localmente e se os builds passam.
2. Revise migrações novas, se houver; considere backup e riscos de alterações de esquema.
3. Faça commit e push para a branch configurada no Render (`main` na publicação realizada).
4. Acompanhe os deploys de frontend e backend no painel Render.
5. Confirme o health check, abra o site e execute testes funcionais após a atualização.
6. Caso o frontend passe a utilizar outro endereço de API, atualize `environment.ts`; caso o endereço do site mude, atualize `CORS_ORIGIN` e publique novamente.

## Testes já realizados em produção

- Aplicação Angular acessível pelo endereço público.
- Endpoint `/api/products` respondendo com JSON paginado.
- Cadastro de produto persistido no PostgreSQL do Render e exibido no catálogo.
- Pedido realizado e localizado posteriormente em “Meus pedidos”.

**Ainda não comprovados nesta revisão:** teste completo de todas as permissões administrativas, recuperação de senha, processamento automático de vencimentos e fechamento automático de lotes no ambiente publicado.

## Cuidados operacionais

- Não executar `npm run db:seed` no banco de produção: o seed de demonstração pode substituir ou alterar dados.
- Não presumir que o plano gratuito oferece retenção indefinida, backups automáticos ou disponibilidade contínua; consultar as condições vigentes do Render antes de depender do serviço.
- O banco de produção começa separado dos dados locais; os produtos locais não são copiados automaticamente.
- Para diagnosticar falhas, consultar logs do serviço, variáveis de ambiente e estado das migrações.
