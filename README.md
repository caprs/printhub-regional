PrintHub Regional
Marketplace regional de produtos impressos em 3D com organização de pedidos em lotes coletivos.

Projeto Integrador — Engenharia de Software, UNIFIO (2026).
Equipe: Ana Livia Caprioli Francisco (frontend) e Miguel Vita de Oliveira (backend).
Acesse o projeto

- Aplicação publicada: https://printhub-web-4kmp.onrender.com
- API REST: https://printhub-api-7wby.onrender.com/api
- Documentação interativa da API (Swagger): https://printhub-api-7wby.onrender.com/api/docs
- Código-fonte: https://github.com/caprs/printhub-regional
  A aplicação foi publicada no Render e possui um ambiente de demonstração configurado, com usuários de diferentes perfis, produtos, pontos de retirada, pedidos e lotes coletivos. Os principais fluxos do sistema foram testados no ambiente publicado.
  Sobre o sistema
  O PrintHub conecta produtores regionais de peças impressas em 3D a consumidores. Os usuários podem consultar produtos, montar um carrinho, realizar pedidos e escolher pontos de retirada. O sistema também organiza pedidos em lotes para compartilhamento do custo de entrega.

Perfis: consumidor, produtor, atendente e administrador. O acesso às funcionalidades depende das permissões de cada perfil.
Tecnologias
Camada Tecnologias
Frontend Angular 21, TypeScript, SCSS, Angular Material, RxJS
Backend Node.js, Express 5, TypeScript, API REST
Banco de dados PostgreSQL, Prisma
Autenticação JWT e autorização por perfil
Publicação Render (site estático, API e PostgreSQL)

O frontend utiliza NgModules, rotas com carregamento sob demanda e saída SPA, sem SSR/SSG.
Estrutura do repositório
Caminho Conteúdo
frontend/ Aplicação Angular
backend/ API REST, Prisma e testes do backend
docs/documentacao-tecnica.md Arquitetura, funcionalidades, regras e verificações
docs/diagrama-classes.md Diagrama das entidades e seus relacionamentos
docs/api-contrato.md Endpoints, campos, permissões e respostas da API
docs/publicacao.md Configuração e publicação no Render
docs/checklist-entrega.md Requisitos e situação da entrega
render.yaml Blueprint dos serviços no Render

## Avaliação da aplicação publicada

A aplicação possui um ambiente de demonstração previamente configurado para facilitar a avaliação do Projeto Integrador.

### Contas de demonstração em produção

| Perfil        | E-mail                   |
| ------------- | ------------------------ |
| Administrador | admin@printhub.demo      |
| Produtor      | produtor@printhub.demo   |
| Consumidor    | consumidor@printhub.demo |

As senhas de acesso serão disponibilizadas na entrega privada do AVA.

### Dados de demonstração

O ambiente publicado foi preparado com:

- 4 produtos cadastrados, com imagens, preços e estoque;
- 2 pontos de retirada ativos;
- 4 pedidos aceitos pelo produtor;
- 1 lote coletivo fechado, contendo 3 pedidos;
- 1 lote coletivo em formação, contendo 1 pedido;
- Dashboard com indicadores alimentados pelos dados cadastrados.

### Roteiro de avaliação

**Consumidor:**

- Acessar o catálogo de produtos;
- Adicionar produtos ao carrinho;
- Realizar um pedido e selecionar um ponto de retirada;
- Acompanhar os pedidos e lotes coletivos.

**Produtor:**

- Cadastrar, editar e excluir produtos;
- Consultar e aceitar pedidos recebidos;
- Acompanhar os lotes coletivos;
- Consultar os indicadores do dashboard.

**Administrador:**

- Acessar o painel administrativo;
- Gerenciar pontos de retirada;
- Consultar as funcionalidades administrativas disponíveis.

### Formação dos lotes coletivos

O sistema agrupa pedidos aceitos em lotes coletivos, que são fechados ao atingir três pedidos ou completar sete dias.

Durante a validação em produção, o custo de entrega de R$ 8,00 foi dividido entre três pedidos, resultando em uma taxa apresentada de R$ 2,67 por pedido, demonstrando uma economia aproximada de 66,6%.

A aplicação está hospedada no plano gratuito do Render, podendo apresentar demora no primeiro acesso após um período de inatividade.

Executar localmente
Pré-requisitos: Node.js 20 ou superior, npm e Docker Desktop (ou uma instância PostgreSQL compatível).

Abra dois terminais na raiz do repositório.
Terminal 1 — Banco e backend
cd backend
Copy-Item .env.example .env
docker compose up -d
npm ci
npm run db:migrate
npm run db:seed
npm run dev
Antes de iniciar a API, configure DATABASE_URL e JWT_SECRET em backend/.env, conforme as orientações do arquivo de exemplo. O seed é destinado somente ao ambiente local de demonstração e não deve ser executado sobre dados de produção. Consulte também [`backend/README.md`](backend/README.md).
Terminal 2 — Frontend
cd frontend
npm ci
npm start
Endereços locais:

- Frontend: http://localhost:4200
- API: http://localhost:3000/api
- Swagger: http://localhost:3000/api/docs
  Para desenvolvimento, confira a URL da API em frontend/src/environments/environment.development.ts.
  Usuários de demonstração (apenas banco local com seed)
  As contas abaixo são criadas para testes locais. Não são credenciais da aplicação publicada.
  Perfil E-mail
  Administrador admin@printhub.local
  Produtor produtor.a@printhub.local (também .b e .c)
  Consumidor consumidor.a@printhub.local (também .b e .c)
  Atendente atendente.centro@printhub.local, atendente.bairro@printhub.local

Senha de demonstração do seed local: printhub123. Não reutilize essa senha em contas reais.
Build e testes
No diretório backend/:
npm run typecheck
npm run build
npm test
No diretório frontend/:
npm run build
npm test
Atenção: os testes de integração do backend podem limpar tabelas do banco de testes configurado. Confira a configuração do ambiente de teste antes de executá-los; nunca aponte testes destrutivos para o banco de produção.

Os builds de frontend e backend e o typecheck do backend foram executados com sucesso durante a revisão final. O build Angular apresentou um aviso de orçamento de bundle, sem impedir a compilação. A contagem histórica documentada é de 91 testes de backend e 29 de frontend; essa contagem não equivale a uma nova execução das suítes nesta revisão.
Documentação
Para mais detalhes, consulte a [documentação técnica](docs/documentacao-tecnica.md), o [diagrama de classes](docs/diagrama-classes.md), o [contrato da API](docs/api-contrato.md), o [guia de publicação](docs/publicacao.md) e o [checklist de entrega](docs/checklist-entrega.md).

## Estado do projeto

O PrintHub Regional está publicado no Render e possui um ambiente de demonstração configurado para avaliação.

Foram validados em produção:

- Cadastro e autenticação de consumidores e produtores;
- Acesso ao painel administrativo;
- Cadastro de pontos de retirada;
- Cadastro e consulta de produtos com imagens;
- Fluxo de compra e acompanhamento de pedidos;
- Aceitação de pedidos pelo produtor;
- Formação e fechamento automático de lotes coletivos por quantidade de pedidos;
- Divisão do custo de entrega;
- Indicadores do dashboard.

Os resultados obtidos demonstram o funcionamento integrado do frontend, backend e banco de dados no ambiente publicado.

As demais funcionalidades e permissões devem ser verificadas conforme o checklist de entrega.
