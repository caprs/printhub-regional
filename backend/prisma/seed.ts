// Dados de demonstração. Apaga tudo e recria — use só em desenvolvimento.
// Os produtos e pontos são os mesmos dos serviços demonstrativos do frontend.
import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/prisma.js';
import type { Role } from '../src/generated/prisma/client.js';

const PASSWORD = 'printhub123';

async function main() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE users, products, pickup_points, orders, order_items, batches, reviews,
             order_status_history, audit_logs, password_reset_tokens
    RESTART IDENTITY CASCADE
  `);

  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const user = (name: string, email: string, role: Role) =>
    prisma.user.create({ data: { name, email, role, passwordHash } });

  await user('Administrador', 'admin@printhub.local', 'ADMINISTRADOR');
  const produtorA = await user('Produtor Exemplo A', 'produtor.a@printhub.local', 'PRODUTOR');
  const produtorB = await user('Produtor Exemplo B', 'produtor.b@printhub.local', 'PRODUTOR');
  const produtorC = await user('Produtor Exemplo C', 'produtor.c@printhub.local', 'PRODUTOR');
  await user('Cliente Exemplo A', 'consumidor.a@printhub.local', 'CONSUMIDOR');
  await user('Cliente Exemplo B', 'consumidor.b@printhub.local', 'CONSUMIDOR');
  await user('Cliente Exemplo C', 'consumidor.c@printhub.local', 'CONSUMIDOR');
  const atendenteCentro = await user('Atendente Centro', 'atendente.centro@printhub.local', 'ATENDENTE');
  const atendenteBairro = await user('Atendente Bairro', 'atendente.bairro@printhub.local', 'ATENDENTE');

  await prisma.pickupPoint.createMany({
    data: [
      {
        name: 'Ponto Centro',
        address: 'Endereço demonstrativo — Centro',
        district: 'Centro',
        city: 'Ourinhos - SP',
        deliveryCostCents: 1800,
        responsibleUserId: atendenteCentro.id,
      },
      {
        name: 'Ponto Bairro',
        address: 'Endereço demonstrativo — Bairro',
        district: 'Bairro demonstrativo',
        city: 'Ourinhos - SP',
        deliveryCostCents: 2400,
        responsibleUserId: atendenteBairro.id,
      },
    ],
  });

  const image = (text: string) => `https://placehold.co/600x400/e8eefc/2563eb?text=${text}`;

  await prisma.product.createMany({
    data: [
      {
        producerId: produtorA.id,
        name: 'Organizador de mesa',
        description: 'Organizador impresso em 3D para guardar objetos e acessórios de escritório.',
        category: 'Organização',
        material: 'PLA',
        color: 'Azul',
        priceCents: 3500,
        imageUrl: image('Organizador+3D'),
        availableQuantity: 10,
        productionDays: 3,
      },
      {
        producerId: produtorB.id,
        name: 'Suporte para celular',
        description: 'Suporte para celular produzido em impressão 3D, ideal para mesas e escritórios.',
        category: 'Acessórios',
        material: 'PLA',
        color: 'Preto',
        priceCents: 2200,
        imageUrl: image('Suporte+3D'),
        availableQuantity: 15,
        productionDays: 2,
      },
      {
        producerId: produtorA.id,
        name: 'Vaso geométrico',
        description: 'Vaso decorativo com formato geométrico, produzido por impressão 3D.',
        category: 'Decoração',
        material: 'PETG',
        color: 'Branco',
        priceCents: 4800,
        imageUrl: image('Vaso+3D'),
        availableQuantity: 8,
        productionDays: 4,
      },
      {
        producerId: produtorC.id,
        name: 'Porta-chaves de parede',
        description: 'Porta-chaves compacto para organizar chaves e pequenos acessórios.',
        category: 'Utilidades',
        material: 'PLA',
        color: null,
        priceCents: 2990,
        imageUrl: image('Porta-chaves'),
        availableQuantity: 12,
        productionDays: 2,
      },
    ],
  });

  console.info(`Seed concluído. Senha de todos os usuários: ${PASSWORD}`);
}

main()
  .catch(error => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
