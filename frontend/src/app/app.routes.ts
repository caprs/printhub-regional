import { Routes } from '@angular/router';

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
    path: 'carrinho',
    loadComponent: () =>
      import('./pages/carrinho/carrinho').then(m => m.Carrinho),
    title: 'PrintHub Regional | Carrinho'
  },
  {
    path: 'meus-pedidos',
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
  loadComponent: () =>
    import('./pages/checkout/checkout')
      .then(m => m.Checkout),
  title: 'PrintHub Regional | Finalizar pedido'
},
{
  path: 'painel-produtor',
  loadComponent: () =>
    import('./pages/painel-produtor/painel-produtor')
      .then(m => m.PainelProdutor),
  title: 'PrintHub Regional | Painel do produtor'
},
{
  path: 'ponto-retirada',
  loadComponent: () =>
    import('./pages/ponto-retirada/ponto-retirada')
      .then(m => m.PontoRetirada),
  title: 'PrintHub Regional | Ponto de retirada'
},
{
  path: 'dashboard',
  loadComponent: () =>
    import('./pages/dashboard/dashboard')
      .then(m => m.Dashboard),
  title: 'PrintHub Regional | Dashboard administrativo'
},
{
  path: 'gerenciar-pontos',
  loadComponent: () =>
    import('./pages/gerenciar-pontos/gerenciar-pontos')
      .then(m => m.GerenciarPontos),
  title: 'PrintHub Regional | Gerenciar pontos de retirada'
},
  {
    path: '**',
    redirectTo: ''
  }
];