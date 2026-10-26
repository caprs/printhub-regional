# Contrato da API — PrintHub Regional

Versão 1.0 · 25/10/2026 · Backend: Miguel

Todas as rotas deste documento estão implementadas e testadas.
Documentação interativa (Swagger): `http://localhost:3000/api/docs`.

Este documento diz **o que o Angular envia e o que recebe** em cada rota.
Os nomes dos campos seguem os modelos que já existem em `frontend/src/app/core/models`, para mudar o mínimo possível no frontend.

---

## 1. Regras gerais

| Item | Definição |
|---|---|
| URL local | `http://localhost:3000/api` |
| Formato | JSON, campos em camelCase |
| IDs | números inteiros |
| Dinheiro | número em reais com 2 casas (`29.9`). O backend guarda em centavos. |
| Datas | texto ISO 8601 em UTC (`2026-10-25T14:30:00.000Z`) |
| Autenticação | cabeçalho `Authorization: Bearer <token>` |
| Token | JWT, vale 7 dias |
| CORS | Em desenvolvimento aceita qualquer `http://localhost:<porta>`. Em produção, só o que estiver em `CORS_ORIGIN`. |

### Resposta de lista (com paginação)

```json
{
  "data": [ ... ],
  "meta": { "pagina": 1, "porPagina": 12, "total": 40, "totalPaginas": 4 }
}
```

Parâmetros de paginação em qualquer lista: `?pagina=1&porPagina=12` (máximo 50).

### Resposta de erro

```json
{
  "erro": {
    "codigo": "ESTOQUE_INSUFICIENTE",
    "mensagem": "A quantidade solicitada ultrapassa o estoque disponível.",
    "detalhes": { "produtoId": 3 }
  }
}
```

A `mensagem` já vem pronta para mostrar ao usuário.

| HTTP | Quando |
|---|---|
| 400 | Dado inválido (campo faltando, formato errado). `detalhes` lista os campos. |
| 401 | Sem token ou token inválido |
| 403 | Logado, mas o perfil não pode fazer isso |
| 404 | Não encontrado |
| 409 | Regra de negócio impediu (estoque, status, prazo) |
| 413 | Corpo da requisição grande demais (acima de 100 KB) |
| 429 | Muitas tentativas de login/cadastro (`MUITAS_TENTATIVAS`) |

---

## 2. Perfis e status

### Perfis (`perfil`)

`CONSUMIDOR` · `PRODUTOR` · `ATENDENTE` · `ADMINISTRADOR`

O cadastro público só aceita `CONSUMIDOR` e `PRODUTOR`. O administrador cria atendentes e outros administradores.

### Status do pedido

Mesmos nomes de `pedido.model.ts`:

```
AGUARDANDO_ACEITACAO ─┬─> ACEITO ─> EM_PRODUCAO ─> PRONTO_PARA_ENTREGA ─> DISPONIVEL_RETIRADA ─> RETIRADO
                      ├─> REJEITADO   (produtor recusou)
                      └─> CANCELADO   (consumidor cancelou ou 48 h sem resposta)
```

| Passagem | Quem faz | Rota |
|---|---|---|
| → ACEITO / REJEITADO | Produtor | `/accept`, `/reject` |
| → EM_PRODUCAO, → PRONTO_PARA_ENTREGA | Produtor | `/status` |
| → DISPONIVEL_RETIRADA | Atendente do ponto | `/received` |
| → RETIRADO | Atendente do ponto | `/picked-up` |
| → CANCELADO | Consumidor ou sistema | `/cancel` ou automático |

### Status do lote

Mesmos nomes de `lote.model.ts`:

| Status | Significado |
|---|---|
| `EM_FORMACAO` | Recebendo pedidos aceitos. Taxa ainda estimada. |
| `FECHADO` | Chegou a 3 pedidos ou a 7 dias. Taxa definitiva. Nenhum pedido começou a produção. |
| `AGUARDANDO_PRODUCAO` | Fechado; a produção começou, mas nem todos os pedidos estão prontos |
| `PRONTO_PARA_ENTREGA` | Fechado e todos os pedidos prontos, no ponto ou retirados |
| `CONCLUIDO` | Todos os pedidos retirados (ou o lote venceu sem nenhum pedido ativo) |

O backend muda o status do lote sozinho. O frontend só lê.

---

## 3. Regras que o backend garante

| Regra | Como funciona |
|---|---|
| RN01 | Produto só é criado com preço, prazo, material e imagem. |
| RN02 | Pedido sem `pontoRetiradaId` é recusado (400). |
| RN03 | O estoque é reservado quando o pedido é criado. Volta se o pedido for rejeitado ou cancelado. |
| RN04 | Pedido sem resposta em 48 h vira `CANCELADO` automaticamente. |
| RN05 | Consumidor cancela só em `AGUARDANDO_ACEITACAO`, ou em `ACEITO` com o lote ainda `EM_FORMACAO`. |
| RN06 / RN13 | O lote fecha com 3 pedidos ou 7 dias após a abertura, o que vier primeiro. |
| RN07 | Só o atendente vinculado ao ponto confirma recebimento e retirada. |
| RN08 | Avaliação só para pedido `RETIRADO`, uma por produto do pedido. |
| RN09 | Produtor pode comprar de outros produtores, nunca de si mesmo. |
| RN11 | Todos os itens do pedido precisam ser do mesmo produtor. |
| RN12 / RN14 | Pedido entra no lote no momento do aceite. Lote fechado não recebe mais pedidos. |
| RN15 / RN16 | Taxa = custo do ponto ÷ pedidos do lote, em centavos. Sobra de centavos vai para os primeiros pedidos. Ex.: R$ 20,00 ÷ 3 = 6,67 + 6,67 + 6,66. |
| RN17 | Antes de o lote fechar, `taxaEntrega` é `null` e `taxaEstimada` traz a estimativa. |
| RN19 | O atendente só confirma recebimento de pedido cujo lote já fechou. |

---

## 4. Autenticação

### `POST /auth/register` — público

Envia:
```json
{ "nome": "Maria Souza", "email": "maria@email.com", "telefone": "(14) 99999-0000", "senha": "minimo8", "perfil": "CONSUMIDOR" }
```
- `senha`: mínimo 8 caracteres.
- `telefone`: opcional; 10 a 20 caracteres entre dígitos, espaço, `( ) + -`.
- `perfil`: `CONSUMIDOR` ou `PRODUTOR`.

Recebe `201`:
```json
{
  "token": "eyJhbGciOi...",
  "usuario": { "id": 7, "nome": "Maria Souza", "email": "maria@email.com", "telefone": "(14) 99999-0000", "perfil": "CONSUMIDOR" }
}
```
Erro `409 EMAIL_EM_USO`.

### `POST /auth/login` — público

Envia `{ "email": "...", "senha": "..." }`. Recebe `200` igual ao cadastro.
Se for atendente, `usuario` traz também `pontoRetiradaId`.
Erro `401 CREDENCIAIS_INVALIDAS` (mesma mensagem para e-mail ou senha errados).

### `GET /auth/me` — logado

Recebe `200` com o objeto `usuario` (mesmo formato do login).

### `POST /auth/forgot-password` — público

Envia `{ "email": "..." }`. Sempre responde `200 { "mensagem": "..." }`, exista o e-mail ou não.
**Pendente:** ainda não há envio de e-mail. Em desenvolvimento a resposta traz `tokenRecuperacao` para teste.

### `POST /auth/reset-password` — público

Envia `{ "token": "...", "novaSenha": "..." }`. Token vale 1 hora e só pode ser usado uma vez.

---

## 5. Produtos

### Objeto `Produto`

Igual a `produto.model.ts`, com dois campos a mais (`cor`, `ativo`) e dois de avaliação:

```json
{
  "id": 1,
  "produtorId": 2,
  "produtor": "Produtor Exemplo A",
  "nome": "Organizador de mesa",
  "descricao": "Organizador impresso em 3D...",
  "categoria": "Organização",
  "material": "PLA",
  "cor": "Azul",
  "preco": 35,
  "imagem": "https://...",
  "estoque": 10,
  "prazoProducao": 3,
  "ativo": true,
  "notaMedia": 4.5,
  "totalAvaliacoes": 2
}
```
`cor` pode ser `null`. `notaMedia` é `null` sem avaliações.

### `GET /products` — público

Filtros (todos opcionais):

| Parâmetro | Exemplo | Efeito |
|---|---|---|
| `busca` | `vaso` | Procura no nome, descrição e material |
| `categoria` | `Decoração` | |
| `material` | `PLA` | |
| `precoMin`, `precoMax` | `10`, `50` | Em reais |
| `produtorId` | `2` | |
| `ordenar` | `preco_asc`, `preco_desc`, `recentes` | Padrão: `recentes` |
| `pagina`, `porPagina` | | Paginação |

Só lista produtos ativos. Recebe lista paginada de `Produto`.

### `GET /products/:id` — público

Recebe `Produto`. `404` se não existir ou estiver inativo.

### `POST /products` — PRODUTOR

Envia:
```json
{
  "nome": "Vaso geométrico",
  "descricao": "...",
  "categoria": "Decoração",
  "material": "PETG",
  "cor": "Branco",
  "preco": 48,
  "imagem": "https://...",
  "estoque": 8,
  "prazoProducao": 4
}
```
- O produtor vem do token. Não envie `produtorId`.
- `imagem`: URL começando com `http://` ou `https://`. **Pendente:** upload de arquivo não faz parte do MVP.
- `nome` 3–120 caracteres · `preco` de 0,01 a 10.000,00 · `estoque` de 0 a 100.000 · `prazoProducao` 1–60 dias.
- Produtos de um produtor desativado pelo administrador somem do catálogo.

Recebe `201` com o `Produto`.

### `PATCH /products/:id` — PRODUTOR dono

Envia só os campos que mudaram. Recebe `200` com o `Produto`. `403` se não for o dono.
Para reativar um produto excluído, envie `{ "ativo": true }`.

### `DELETE /products/:id` — PRODUTOR dono

Desativa o produto (não apaga, porque ele pode estar em pedidos). Recebe `204`.

### `GET /producers/me/products` — PRODUTOR

Lista os produtos do produtor logado, **incluindo os inativos**. Paginada.

---

## 6. Pontos de retirada

### Objeto `PontoRetirada`

Igual a `ponto-retirada.model.ts`, com o atendente e a estimativa do lote aberto:

```json
{
  "id": 1,
  "nome": "Ponto Centro",
  "endereco": "Rua ...",
  "bairro": "Centro",
  "cidade": "Ourinhos - SP",
  "custoEntrega": 18,
  "ativo": true,
  "atendenteId": 5,
  "atendente": "Atendente Centro",
  "loteAberto": {
    "id": 3,
    "codigo": "LOTE-003",
    "quantidadePedidos": 1,
    "dataLimite": "2026-10-31T14:00:00.000Z"
  },
  "taxaEstimada": { "maxima": 9, "minima": 6 }
}
```
`loteAberto` é `null` quando não há lote em formação.

**Para o checkout:** use `taxaEstimada`, que vem sempre preenchida.
- `maxima`: a taxa se o pedido for aceito agora e o lote fechar sem mais ninguém. Sem lote aberto, é o `custoEntrega` inteiro.
- `minima`: a taxa com o lote cheio (3 pedidos).

Mostre algo como "Taxa de entrega: até R$ 9,00 (pode cair para R$ 6,00)". Isso substitui o cálculo fixo `custoEntrega / 3` que está hoje no `checkout.ts`.

### `GET /pickup-points` — público

Lista só os ativos. O administrador pode usar `?todos=true` para ver os inativos.
Um token vencido nesta rota é ignorado (não dá 401), para o checkout não quebrar.

### `GET /pickup-points/:id` — público

Detalhes de um ponto ativo. O administrador também vê inativos.

### `POST /pickup-points` — ADMINISTRADOR

Envia `{ "nome", "endereco", "bairro", "cidade", "custoEntrega", "atendenteId" }`. `atendenteId` é opcional. Recebe `201`.

### `PATCH /pickup-points/:id` — ADMINISTRADOR

Envia os campos que mudaram, incluindo `ativo` para ativar ou desativar.
A mudança de `custoEntrega` não altera lotes já abertos.

### `DELETE /pickup-points/:id` — ADMINISTRADOR

Desativa o ponto. Recebe `204`.

---

## 7. Pedidos

### Objeto `Pedido`

Mantém todos os campos de `pedido.model.ts` e acrescenta detalhes:

```json
{
  "id": 1001,
  "data": "2026-10-23T13:00:00.000Z",
  "status": "ACEITO",

  "produtor": "Produtor Exemplo A",
  "produtorId": 2,
  "cliente": "Maria Souza",
  "clienteId": 7,
  "clienteTelefone": "(14) 99999-0000",
  "produtos": ["Organizador de mesa", "Vaso geométrico"],
  "itens": [
    { "produtoId": 1, "nome": "Organizador de mesa", "quantidade": 1, "precoUnitario": 35, "subtotal": 35, "avaliado": false },
    { "produtoId": 3, "nome": "Vaso geométrico", "quantidade": 1, "precoUnitario": 48, "subtotal": 48, "avaliado": false }
  ],

  "pontoRetirada": "Ponto Centro",
  "pontoRetiradaId": 1,
  "lote": "LOTE-001",
  "loteId": 1,
  "loteStatus": "EM_FORMACAO",

  "subtotal": 83,
  "taxaEntrega": null,
  "taxaEstimada": 9,
  "total": 92,
  "taxaDefinitiva": false,

  "prazoAceite": "2026-10-25T13:00:00.000Z",
  "aceitoEm": "2026-10-23T15:20:00.000Z",
  "motivoRecusa": null,
  "motivoCancelamento": null,
  "avaliado": false
}
```

| Campo | Regra |
|---|---|
| `produtos` | Só os nomes, como o frontend usa hoje |
| `precoUnitario` | Preço no momento da compra. Não muda se o produtor editar o produto. |
| `taxaEntrega` | `null` até o lote fechar. Depois, o valor definitivo. |
| `taxaEstimada` | Igual a `taxaEntrega` quando definitiva. Antes disso, a estimativa máxima. |
| `total` | `subtotal + taxaEstimada` |
| `taxaEstimada` / `total` | `null` / só o subtotal quando o pedido foi recusado ou cancelado |
| `lote`, `loteId`, `loteStatus` | `null` antes do aceite |
| `prazoAceite` | Até quando o produtor pode responder (criação + 48 h) |
| `motivoRecusa` | Texto do produtor ao recusar, ou `null` |
| `motivoCancelamento` | `CONSUMIDOR`, `PRAZO_EXPIRADO` (48 h sem resposta) ou `null` |
| `itens[].avaliado` | Use para mostrar o botão "Avaliar" em cada produto |
| `avaliado` | `true` se o consumidor já avaliou todos os produtos |

### `POST /orders` — CONSUMIDOR ou PRODUTOR

Envia:
```json
{
  "pontoRetiradaId": 1,
  "itens": [
    { "produtoId": 1, "quantidade": 1 },
    { "produtoId": 3, "quantidade": 2 }
  ]
}
```
O preço vem do banco, nunca do frontend.

Recebe `201` com o `Pedido` em `AGUARDANDO_ACEITACAO`.

| Erro | Código |
|---|---|
| 409 | `PRODUTORES_DIFERENTES` |
| 409 | `ESTOQUE_INSUFICIENTE` (`detalhes.produtoId`) |
| 409 | `PRODUTO_PROPRIO` |
| 409 | `PONTO_INATIVO` / `PRODUTO_INATIVO` |

### `GET /orders/my` — logado

Pedidos que o usuário fez. Filtro `?status=`. Paginada.

### `GET /orders/:id` — envolvidos

Consumidor do pedido, produtor do pedido, atendente do ponto ou administrador.

### `GET /producer/orders` — PRODUTOR

Pedidos recebidos pelo produtor. Filtro `?status=`. Paginada.

### `PATCH /orders/:id/accept` — PRODUTOR dono

Sem corpo. O pedido vira `ACEITO` e entra no lote aberto do ponto. Se não houver lote aberto, o backend cria um. Se for o 3º pedido, o lote fecha.
Erro `409 PRAZO_EXPIRADO` depois de 48 h.

### `PATCH /orders/:id/reject` — PRODUTOR dono

Envia `{ "motivo": "texto opcional" }`. O pedido vira `REJEITADO` e o estoque volta.

### `PATCH /orders/:id/status` — PRODUTOR dono

Envia `{ "status": "EM_PRODUCAO" }` ou `{ "status": "PRONTO_PARA_ENTREGA" }`.
Erro `409 TRANSICAO_INVALIDA` fora da ordem.

### `PATCH /orders/:id/cancel` — CONSUMIDOR dono

Sem corpo. Ver RN05. Erro `409 CANCELAMENTO_NAO_PERMITIDO`.

### `GET /attendant/orders` — ATENDENTE

**Rota nova**, não estava no contexto original. Lista os pedidos do ponto do atendente.
Filtro `?status=PRONTO_PARA_ENTREGA` (aguardando recebimento) ou `?status=DISPONIVEL_RETIRADA`.

### `PATCH /orders/:id/received` — ATENDENTE do ponto

Sem corpo. `PRONTO_PARA_ENTREGA` → `DISPONIVEL_RETIRADA`. Exige o lote fechado: com `loteStatus` = `EM_FORMACAO` a resposta é `409 LOTE_EM_FORMACAO`. Use `loteStatus` para desabilitar o botão.

### `PATCH /orders/:id/picked-up` — ATENDENTE do ponto

Sem corpo. `DISPONIVEL_RETIRADA` → `RETIRADO`. O pagamento é presencial; o sistema não registra valores pagos.

---

## 8. Lotes

### Objeto `Lote`

Igual a `lote.model.ts`, com a taxa:

```json
{
  "id": 1,
  "codigo": "LOTE-001",
  "pontoRetiradaId": 1,
  "pontoRetirada": "Ponto Centro",
  "dataAbertura": "2026-10-20T13:00:00.000Z",
  "dataLimite": "2026-10-27T13:00:00.000Z",
  "dataFechamento": "2026-10-22T09:12:00.000Z",
  "quantidadePedidos": 3,
  "capacidade": 3,
  "custoEntrega": 18,
  "taxaPorPedido": 6,
  "taxaDefinitiva": true,
  "status": "FECHADO"
}
```
- `custoEntrega` é copiado do ponto quando o lote é criado.
- `taxaPorPedido` antes do fechamento é a estimativa atual (`custoEntrega ÷ quantidadePedidos`).
- `dataFechamento` é `null` enquanto `EM_FORMACAO`.

### `GET /batches` — logado

Filtros `?pontoRetiradaId=` e `?status=`. Paginada.

### `GET /batches/:id` — logado

### `GET /batches/:id/orders` — ADMINISTRADOR ou ATENDENTE do ponto

Lista os pedidos do lote.

---

## 9. Avaliações

### `POST /reviews` — CONSUMIDOR do pedido

Envia `{ "pedidoId": 1001, "produtoId": 1, "nota": 5, "comentario": "opcional" }`.
- `nota`: inteiro de 1 a 5.
- Erros `409 PEDIDO_NAO_RETIRADO` e `409 JA_AVALIADO`.

### `GET /products/:id/reviews` e `GET /producers/:id/reviews` — público

```json
{
  "data": [ { "id": 1, "nota": 5, "comentario": "...", "autor": "Maria S.", "produto": "Vaso geométrico", "data": "..." } ],
  "meta": { ... },
  "resumo": { "notaMedia": 4.5, "totalAvaliacoes": 2 }
}
```
A nota do produtor é a média das avaliações dos produtos dele.

---

## 10. Administração

### `GET /dashboard` — ADMINISTRADOR ou PRODUTOR

O administrador vê os números gerais e o produtor vê só os dele.

```json
{
  "pedidos": { "total": 40, "emAndamento": 12, "aguardandoAceitacao": 2, "retirados": 25, "porStatus": { "ACEITO": 3, "...": 0 } },
  "produtos": { "ativos": 18 },
  "pontosAtivos": 2,
  "lotes": { "emFormacao": 2, "fechados": 5, "concluidos": 3 },
  "maisVendidos": [ { "produtoId": 1, "nome": "Organizador de mesa", "quantidade": 14 } ]
}
```
Os 3 KPIs principais: pedidos em andamento, lotes em formação/fechados e produtos mais vendidos.
- `emAndamento`: pedidos de `AGUARDANDO_ACEITACAO` até `DISPONIVEL_RETIRADA`.
- `lotes.fechados`: todos os que já saíram de `EM_FORMACAO` (inclui os concluídos).
- `maisVendidos`: top 5 por quantidade, só pedidos aceitos (recusados e cancelados não contam).

### `GET /admin/users` — ADMINISTRADOR

Filtros `?perfil=`, `?busca=` (nome ou e-mail) e `?ativo=true|false`. Paginada. Nunca retorna senha.

```json
{ "id": 8, "nome": "Atendente Centro", "email": "atendente.centro@printhub.local", "perfil": "ATENDENTE", "ativo": true, "criadoEm": "...", "pontoRetiradaId": 1 }
```

### `POST /admin/users` — ADMINISTRADOR

**Rota nova.** Cria atendente ou administrador: `{ "nome", "email", "senha", "perfil" }`.

### `PATCH /admin/users/:id` — ADMINISTRADOR

Envia qualquer um de `{ "nome": "...", "perfil": "...", "ativo": false }`.
- Usuário inativo não consegue logar e perde o acesso na hora, mesmo com token válido.
- A troca de perfil vale na próxima requisição, sem novo login.
- `409 ALTERACAO_PROPRIA`: o admin não pode desativar nem rebaixar a própria conta.
- `409 ATENDENTE_VINCULADO`: troque o atendente do ponto antes de mudar o perfil dele.

### `GET /admin/audit-logs` — ADMINISTRADOR

```json
{ "id": 1, "acao": "PEDIDO_ACEITO", "usuarioId": 2, "usuario": "Produtor A", "entidade": "pedido", "entidadeId": 1001, "dados": { }, "data": "..." }
```
São registradas: login, cadastro, aceite, rejeição, cancelamento, mudança de status, fechamento de lote, recebimento, retirada e alterações feitas pelo administrador.

---

## 11. Usuários de teste (seed)

Senha de todos: `printhub123`

| Perfil | E-mail |
|---|---|
| ADMINISTRADOR | `admin@printhub.local` |
| PRODUTOR | `produtor.a@printhub.local`, `produtor.b@printhub.local`, `produtor.c@printhub.local` |
| CONSUMIDOR | `consumidor.a@printhub.local`, `consumidor.b@printhub.local`, `consumidor.c@printhub.local` |
| ATENDENTE | `atendente.centro@printhub.local`, `atendente.bairro@printhub.local` |

Os produtos e pontos do seed são os mesmos que já estão nos serviços demonstrativos do frontend, com os mesmos IDs.

Pedidos criados pelo seed (todos passam pelas regras da API):

| Pedido | Cliente | Ponto | Situação |
|---|---|---|---|
| 1 | consumidor.a | Centro | `RETIRADO` e avaliado (LOTE-001) |
| 2 | consumidor.b | Centro | `DISPONIVEL_RETIRADA` (LOTE-001) |
| 3 | consumidor.c | Centro | `EM_PRODUCAO` (LOTE-001) |
| 4 | consumidor.a | Bairro | `ACEITO`, lote em formação (LOTE-002) |
| 5 | consumidor.b | Centro | `AGUARDANDO_ACEITACAO` (produtor A precisa responder) |
| 6 | consumidor.c | Bairro | `REJEITADO` |

LOTE-001 está fechado com 3 pedidos de produtores diferentes, a R$ 6,00 cada.

---

## 12. Diferenças em relação ao contexto original

Itens para registrar na ERS:

1. Perfil `ATENDENTE` = responsável pelo ponto de retirada.
2. Status do pedido e do lote seguem os nomes do frontend.
3. Pedido sem resposta em 48 h vira `CANCELADO` (não há status `EXPIRADO`).
4. RN05 detalhada: cancelamento só antes do aceite, ou com o lote ainda em formação.
5. RN19 detalhada: recebimento no ponto só com o lote fechado.
6. Rotas novas: `GET /attendant/orders` e `POST /admin/users`.
7. Avaliação do produtor = média das avaliações dos produtos.
8. Recuperação de senha sem envio de e-mail (pendente).
9. Imagem do produto por URL (upload pendente).
