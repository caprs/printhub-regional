// Documentação OpenAPI servida em /api/docs.
// Os corpos das requisições vêm dos mesmos schemas Zod que validam as rotas,
// então a documentação não fica desatualizada em relação à validação.
import { z } from 'zod';
import { forgotBody, loginBody, registerBody, resetBody } from '../modules/auth/auth.routes.js';
import { productBody, productUpdateBody } from '../modules/products/products.routes.js';
import { pointBody, pointUpdateBody } from '../modules/pickup-points/pickup-points.routes.js';
import { orderBody, rejectBody, statusBody } from '../modules/orders/orders.routes.js';
import { reviewBody } from '../modules/reviews/reviews.routes.js';
import { adminCreateUserBody, adminUpdateUserBody } from '../modules/admin/admin.routes.js';

type Param = { name: string; in: 'query' | 'path'; type?: 'string' | 'integer' | 'number' | 'boolean'; description?: string };

type Route = {
  summary: string;
  tag: string;
  roles?: string;
  body?: z.ZodType;
  params?: Param[];
  success?: number;
};

const jsonSchema = (schema: z.ZodType) => z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any' });

const id: Param = { name: 'id', in: 'path', type: 'integer' };
const page: Param[] = [
  { name: 'pagina', in: 'query', type: 'integer', description: 'Padrão 1' },
  { name: 'porPagina', in: 'query', type: 'integer', description: 'Padrão 12, máximo 50' },
];
const status: Param = { name: 'status', in: 'query', description: 'Filtra por status do pedido' };

const routes: Record<string, Record<string, Route>> = {
  '/auth/register': { post: { tag: 'Autenticação', summary: 'Cadastro de consumidor ou produtor', body: registerBody, success: 201 } },
  '/auth/login': { post: { tag: 'Autenticação', summary: 'Login; devolve o token JWT', body: loginBody } },
  '/auth/me': { get: { tag: 'Autenticação', summary: 'Usuário logado', roles: 'Logado' } },
  '/auth/forgot-password': { post: { tag: 'Autenticação', summary: 'Gera token de recuperação de senha', body: forgotBody } },
  '/auth/reset-password': { post: { tag: 'Autenticação', summary: 'Troca a senha com o token', body: resetBody } },

  '/products': {
    get: {
      tag: 'Produtos',
      summary: 'Catálogo com busca, filtros e paginação',
      params: [
        { name: 'busca', in: 'query' },
        { name: 'categoria', in: 'query' },
        { name: 'material', in: 'query' },
        { name: 'precoMin', in: 'query', type: 'number' },
        { name: 'precoMax', in: 'query', type: 'number' },
        { name: 'produtorId', in: 'query', type: 'integer' },
        { name: 'ordenar', in: 'query', description: 'recentes | preco_asc | preco_desc' },
        ...page,
      ],
    },
    post: { tag: 'Produtos', summary: 'Cadastrar produto (RN01)', roles: 'PRODUTOR', body: productBody, success: 201 },
  },
  '/products/{id}': {
    get: { tag: 'Produtos', summary: 'Detalhes do produto', params: [id] },
    patch: { tag: 'Produtos', summary: 'Editar produto', roles: 'PRODUTOR dono', body: productUpdateBody, params: [id] },
    delete: { tag: 'Produtos', summary: 'Desativar produto', roles: 'PRODUTOR dono', params: [id], success: 204 },
  },
  '/producers/me/products': {
    get: { tag: 'Produtos', summary: 'Produtos do produtor logado, inclusive inativos', roles: 'PRODUTOR', params: page },
  },

  '/pickup-points': {
    get: {
      tag: 'Pontos de retirada',
      summary: 'Pontos ativos com lote aberto e taxa estimada',
      params: [{ name: 'todos', in: 'query', type: 'boolean', description: 'Só administrador: inclui inativos' }],
    },
    post: { tag: 'Pontos de retirada', summary: 'Cadastrar ponto', roles: 'ADMINISTRADOR', body: pointBody, success: 201 },
  },
  '/pickup-points/{id}': {
    get: { tag: 'Pontos de retirada', summary: 'Detalhes do ponto', params: [id] },
    patch: { tag: 'Pontos de retirada', summary: 'Editar, ativar ou desativar', roles: 'ADMINISTRADOR', body: pointUpdateBody, params: [id] },
    delete: { tag: 'Pontos de retirada', summary: 'Desativar ponto', roles: 'ADMINISTRADOR', params: [id], success: 204 },
  },

  '/orders': {
    post: { tag: 'Pedidos', summary: 'Criar pedido (RN02, RN03, RN09, RN11)', roles: 'CONSUMIDOR ou PRODUTOR', body: orderBody, success: 201 },
  },
  '/orders/my': { get: { tag: 'Pedidos', summary: 'Pedidos que eu fiz', roles: 'Logado', params: [status, ...page] } },
  '/orders/{id}': { get: { tag: 'Pedidos', summary: 'Detalhes do pedido', roles: 'Envolvidos no pedido ou ADMINISTRADOR', params: [id] } },
  '/producer/orders': { get: { tag: 'Pedidos', summary: 'Pedidos recebidos pelo produtor', roles: 'PRODUTOR', params: [status, ...page] } },
  '/orders/{id}/accept': {
    patch: { tag: 'Pedidos', summary: 'Aceitar: entra no lote do ponto (RN04, RN06, RN12)', roles: 'PRODUTOR dono', params: [id] },
  },
  '/orders/{id}/reject': { patch: { tag: 'Pedidos', summary: 'Recusar; o estoque volta', roles: 'PRODUTOR dono', body: rejectBody, params: [id] } },
  '/orders/{id}/status': {
    patch: { tag: 'Pedidos', summary: 'Avançar a produção', roles: 'PRODUTOR dono', body: statusBody, params: [id] },
  },
  '/orders/{id}/cancel': { patch: { tag: 'Pedidos', summary: 'Cancelar (RN05)', roles: 'Cliente do pedido', params: [id] } },

  '/attendant/orders': {
    get: { tag: 'Ponto de retirada (atendente)', summary: 'Pedidos do meu ponto', roles: 'ATENDENTE', params: [status, ...page] },
  },
  '/orders/{id}/received': {
    patch: { tag: 'Ponto de retirada (atendente)', summary: 'Confirmar recebimento (RN19)', roles: 'ATENDENTE do ponto', params: [id] },
  },
  '/orders/{id}/picked-up': {
    patch: { tag: 'Ponto de retirada (atendente)', summary: 'Confirmar retirada (RN07)', roles: 'ATENDENTE do ponto', params: [id] },
  },

  '/batches': {
    get: {
      tag: 'Lotes',
      summary: 'Lotes coletivos',
      roles: 'Logado',
      params: [{ name: 'pontoRetiradaId', in: 'query', type: 'integer' }, { name: 'status', in: 'query' }, ...page],
    },
  },
  '/batches/{id}': { get: { tag: 'Lotes', summary: 'Detalhes do lote', roles: 'Logado', params: [id] } },
  '/batches/{id}/orders': { get: { tag: 'Lotes', summary: 'Pedidos do lote', roles: 'ADMINISTRADOR ou ATENDENTE do ponto', params: [id] } },

  '/reviews': { post: { tag: 'Avaliações', summary: 'Avaliar produto de pedido retirado (RN08)', roles: 'Cliente do pedido', body: reviewBody, success: 201 } },
  '/products/{id}/reviews': { get: { tag: 'Avaliações', summary: 'Avaliações do produto', params: [id, ...page] } },
  '/producers/{id}/reviews': { get: { tag: 'Avaliações', summary: 'Avaliações dos produtos do produtor', params: [id, ...page] } },

  '/dashboard': { get: { tag: 'Administração', summary: 'Indicadores (produtor vê só os dele)', roles: 'ADMINISTRADOR ou PRODUTOR' } },
  '/admin/users': {
    get: {
      tag: 'Administração',
      summary: 'Usuários',
      roles: 'ADMINISTRADOR',
      params: [{ name: 'perfil', in: 'query' }, { name: 'busca', in: 'query' }, { name: 'ativo', in: 'query', type: 'boolean' }, ...page],
    },
    post: { tag: 'Administração', summary: 'Criar usuário de qualquer perfil', roles: 'ADMINISTRADOR', body: adminCreateUserBody, success: 201 },
  },
  '/admin/users/{id}': {
    patch: { tag: 'Administração', summary: 'Alterar nome, perfil ou ativar/desativar', roles: 'ADMINISTRADOR', body: adminUpdateUserBody, params: [id] },
  },
  '/admin/audit-logs': {
    get: {
      tag: 'Administração',
      summary: 'Registro das operações críticas',
      roles: 'ADMINISTRADOR',
      params: [{ name: 'acao', in: 'query' }, { name: 'entidade', in: 'query' }, { name: 'usuarioId', in: 'query', type: 'integer' }, ...page],
    },
  },
};

const errorResponse = { $ref: '#/components/responses/Erro' };

function operation(route: Route) {
  const success = route.success ?? 200;
  return {
    tags: [route.tag],
    summary: route.summary,
    description: route.roles ? `Permissão: **${route.roles}**` : 'Rota pública',
    ...(route.roles && { security: [{ bearer: [] }] }),
    parameters: (route.params ?? []).map(p => ({
      name: p.name,
      in: p.in,
      required: p.in === 'path',
      description: p.description,
      schema: { type: p.type ?? 'string' },
    })),
    ...(route.body && { requestBody: { required: true, content: { 'application/json': { schema: jsonSchema(route.body) } } } }),
    responses: {
      [success]: { description: success === 204 ? 'Sem conteúdo' : 'Sucesso. Formato em docs/api-contrato.md.' },
      400: errorResponse,
      ...(route.roles && { 401: errorResponse, 403: errorResponse }),
      404: errorResponse,
      409: errorResponse,
    },
  };
}

export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'PrintHub Regional — API',
    version: '1.0.0',
    description:
      'Marketplace regional de impressão 3D com lotes coletivos. Valores em reais; datas em ISO 8601 (UTC). ' +
      'Faça login em /auth/login e use o token no botão Authorize.',
  },
  servers: [{ url: '/api' }],
  components: {
    securitySchemes: { bearer: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    responses: {
      Erro: {
        description: 'Erro com código e mensagem pronta para exibir',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                erro: {
                  type: 'object',
                  properties: { codigo: { type: 'string' }, mensagem: { type: 'string' }, detalhes: {} },
                },
              },
            },
          },
        },
      },
    },
  },
  paths: Object.fromEntries(
    Object.entries(routes).map(([path, methods]) => [
      path,
      Object.fromEntries(Object.entries(methods).map(([method, route]) => [method, operation(route)])),
    ]),
  ),
};
