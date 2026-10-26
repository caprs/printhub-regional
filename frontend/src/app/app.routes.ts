import { Routes } from '@angular/router';

import { exigirPerfil } from './core/guards/perfil.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/catalogo/catalogo').then(m => m.Catalogo),
    title: 'PrintHub Regional | Catálogo'
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login').then(m => m.Login),
    title: 'PrintHub Regional | Login'
  },
  {
    path: 'cadastro',
    loadComponent: () =>
      import('./pages/cadastro/cadastro').then(m => m.Cadastro),
    title: 'PrintHub Regional | Cadastro'
  },
  {
    path: 'recuperar-senha',
    loadComponent: () =>
      import('./pages/recuperar-senha/recuperar-senha').then(m => m.RecuperarSenha),
    title: 'PrintHub Regional | Recuperar senha'
  },
  {
    path: 'carrinho',
    loadComponent: () =>
      import('./pages/carrinho/carrinho').then(m => m.Carrinho),
    title: 'PrintHub Regional | Carrinho'
  },
  {
    path: 'meus-pedidos',
    canActivate: [exigirPerfil()],
    loadComponent: () =>
      import('./pages/meus-pedidos/meus-pedidos').then(m => m.MeusPedidos),
    title: 'PrintHub Regional | Meus pedidos'
  },
  {
  path: 'produto/:id',
  loadComponent: () =>
    import('./pages/detalhes-produto/detalhes-produto')
      .then(m => m.DetalhesProduto),
  title: 'PrintHub Regional | Detalhes do produto'
},
{
  path: 'checkout',
  canActivate: [exigirPerfil('CONSUMIDOR', 'PRODUTOR')],
  loadComponent: () =>
    import('./pages/checkout/checkout')
      .then(m => m.Checkout),
  title: 'PrintHub Regional | Finalizar pedido'
},
{
  path: 'painel-produtor',
  canActivate: [exigirPerfil('PRODUTOR')],
  loadComponent: () =>
    import('./pages/painel-produtor/painel-produtor')
      .then(m => m.PainelProdutor),
  title: 'PrintHub Regional | Painel do produtor'
},
{
  path: 'ponto-retirada',
  canActivate: [exigirPerfil('ATENDENTE')],
  loadComponent: () =>
    import('./pages/ponto-retirada/ponto-retirada')
      .then(m => m.PontoRetirada),
  title: 'PrintHub Regional | Ponto de retirada'
},
{
  path: 'dashboard',
  canActivate: [exigirPerfil('ADMINISTRADOR', 'PRODUTOR')],
  loadComponent: () =>
    import('./pages/dashboard/dashboard')
      .then(m => m.Dashboard),
  title: 'PrintHub Regional | Dashboard'
},
{
  path: 'gerenciar-pontos',
  canActivate: [exigirPerfil('ADMINISTRADOR')],
  loadComponent: () =>
    import('./pages/gerenciar-pontos/gerenciar-pontos')
      .then(m => m.GerenciarPontos),
  title: 'PrintHub Regional | Gerenciar pontos de retirada'
},
{
  path: 'administracao',
  canActivate: [exigirPerfil('ADMINISTRADOR')],
  loadComponent: () =>
    import('./pages/administracao/administracao')
      .then(m => m.Administracao),
  title: 'PrintHub Regional | Usuários e registros'
},
{
  path: 'lotes',
  canActivate: [exigirPerfil()],
  loadComponent: () =>
    import('./pages/lotes/lotes')
      .then(m => m.LotesPage),
  title: 'PrintHub Regional | Lotes coletivos'
},
  {
    path: '**',
    redirectTo: ''
  }
];
