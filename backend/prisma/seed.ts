// Dados de demonstração. Apaga tudo e recria — use só em desenvolvimento.
// Os produtos e pontos são os mesmos dos serviços demonstrativos do frontend.
// Os pedidos passam pelas mesmas funções da API, então seguem todas as regras.
import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/prisma.js';
import * as orders from '../src/modules/orders/orders.service.js';
import * as reviews from '../src/modules/reviews/reviews.service.js';
import type { AuthUser } from '../src/middlewares/auth.js';
import type { Role } from '../src/generated/prisma/client.js';

const PASSWORD = 'printhub123';

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('O seed apaga o banco: não rode em produção.');

  await prisma.$executeRawUnsafe(`
    TRUNCATE users, products, pickup_points, orders, order_items, batches, reviews,
             order_status_history, audit_logs, password_reset_tokens
    RESTART IDENTITY CASCADE
  `);

  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const user = async (name: string, email: string, role: Role): Promise<AuthUser> => {
    const u = await prisma.user.create({ data: { name, email, role, passwordHash } });
    return { id: u.id, name: u.name, email: u.email, role: u.role };
  };

  await user('Administrador', 'admin@printhub.local', 'ADMINISTRADOR');
  const produtorA = await user('Produtor Exemplo A', 'produtor.a@printhub.local', 'PRODUTOR');
  const produtorB = await user('Produtor Exemplo B', 'produtor.b@printhub.local', 'PRODUTOR');
  const produtorC = await user('Produtor Exemplo C', 'produtor.c@printhub.local', 'PRODUTOR');
  const clienteA = await user('Cliente Exemplo A', 'consumidor.a@printhub.local', 'CONSUMIDOR');
  const clienteB = await user('Cliente Exemplo B', 'consumidor.b@printhub.local', 'CONSUMIDOR');
  const clienteC = await user('Cliente Exemplo C', 'consumidor.c@printhub.local', 'CONSUMIDOR');
  const atendenteCentro = await user('Atendente Centro', 'atendente.centro@printhub.local', 'ATENDENTE');
  const atendenteBairro = await user('Atendente Bairro', 'atendente.bairro@printhub.local', 'ATENDENTE');

  const centro = await prisma.pickupPoint.create({
    data: {
      name: 'Ponto Centro',
      address: 'Endereço demonstrativo — Centro',
      district: 'Centro',
      city: 'Ourinhos - SP',
      deliveryCostCents: 1800,
      responsibleUserId: atendenteCentro.id,
    },
  });
  const bairro = await prisma.pickupPoint.create({
    data: {
      name: 'Ponto Bairro',
      address: 'Endereço demonstrativo — Bairro',
      district: 'Bairro demonstrativo',
      city: 'Ourinhos - SP',
      deliveryCostCents: 2400,
      responsibleUserId: atendenteBairro.id,
    },
  });

  const image = (text: string) => `https://placehold.co/600x400/e8eefc/2563eb?text=${text}`;
  const product = (data: {
    producerId: number;
    name: string;
    description: string;
    category: string;
    material: string;
    color: string | null;
    priceCents: number;
    image: string;
    stock: number;
    days: number;
  }) =>
    prisma.product.create({
      data: {
        producerId: data.producerId,
        name: data.name,
        description: data.description,
        category: data.category,
        material: data.material,
        color: data.color,
        priceCents: data.priceCents,
        imageUrl: image(data.image),
        availableQuantity: data.stock,
        productionDays: data.days,
      },
    });

  const organizador = await product({
    producerId: produtorA.id,
    name: 'Organizador de mesa',
    description: 'Organizador impresso em 3D para guardar objetos e acessórios de escritório.',
    category: 'Organização',
    material: 'PLA',
    color: 'Azul',
    priceCents: 3500,
    image: 'Organizador+3D',
    stock: 10,
    days: 3,
  });
  const suporte = await product({
    producerId: produtorB.id,
    name: 'Suporte para celular',
    description: 'Suporte para celular produzido em impressão 3D, ideal para mesas e escritórios.',
    category: 'Acessórios',
    material: 'PLA',
    color: 'Preto',
    priceCents: 2200,
    image: 'Suporte+3D',
    stock: 15,
    days: 2,
  });
  const vaso = await product({
    producerId: produtorA.id,
    name: 'Vaso geométrico',
    description: 'Vaso decorativo com formato geométrico, produzido por impressão 3D.',
    category: 'Decoração',
    material: 'PETG',
    color: 'Branco',
    priceCents: 4800,
    image: 'Vaso+3D',
    stock: 8,
    days: 4,
  });
  const portaChaves = await product({
    producerId: produtorC.id,
    name: 'Porta-chaves de parede',
    description: 'Porta-chaves compacto para organizar chaves e pequenos acessórios.',
    category: 'Utilidades',
    material: 'PLA',
    color: null,
    priceCents: 2990,
    image: 'Porta-chaves',
    stock: 12,
    days: 2,
  });

  const item = (produtoId: number, quantidade = 1) => [{ produtoId, quantidade }];

  // LOTE-001 (Ponto Centro): 3 pedidos de produtores diferentes, lote fechado, R$ 6,00 cada.
  const p1 = await orders.create(clienteA, { pontoRetiradaId: centro.id, itens: [...item(organizador.id), ...item(vaso.id)] });
  const p2 = await orders.create(clienteB, { pontoRetiradaId: centro.id, itens: item(suporte.id, 2) });
  const p3 = await orders.create(clienteC, { pontoRetiradaId: centro.id, itens: item(portaChaves.id) });
  await orders.accept(p1.id, produtorA);
  await orders.accept(p2.id, produtorB);
  await orders.accept(p3.id, produtorC);

  // Pedido 1: retirado e avaliado.
  await orders.updateStatus(p1.id, produtorA, 'EM_PRODUCAO');
  await orders.updateStatus(p1.id, produtorA, 'PRONTO_PARA_ENTREGA');
  await orders.receive(p1.id, atendenteCentro);
  await orders.pickUp(p1.id, atendenteCentro);
  await reviews.create(clienteA, { pedidoId: p1.id, produtoId: organizador.id, nota: 5, comentario: 'Acabamento muito bom.' });

  // Pedido 2: já no ponto, aguardando o cliente.
  await orders.updateStatus(p2.id, produtorB, 'EM_PRODUCAO');
  await orders.updateStatus(p2.id, produtorB, 'PRONTO_PARA_ENTREGA');
  await orders.receive(p2.id, atendenteCentro);

  // Pedido 3: ainda em produção.
  await orders.updateStatus(p3.id, produtorC, 'EM_PRODUCAO');

  // LOTE-002 (Ponto Bairro): em formação, com 1 pedido aceito.
  const p4 = await orders.create(clienteA, { pontoRetiradaId: bairro.id, itens: item(vaso.id) });
  await orders.accept(p4.id, produtorA);

  // Pedido pendente: o produtor A ainda precisa aceitar ou recusar.
  await orders.create(clienteB, { pontoRetiradaId: centro.id, itens: item(organizador.id, 2) });

  // Pedido recusado.
  const p6 = await orders.create(clienteC, { pontoRetiradaId: bairro.id, itens: item(suporte.id) });
  await orders.reject(p6.id, produtorB, 'Filamento da cor pedida em falta.');

  console.info(`Seed concluído: 9 usuários, 2 pontos, 4 produtos, 6 pedidos, 2 lotes. Senha: ${PASSWORD}`);
}

main()
  .catch(error => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
