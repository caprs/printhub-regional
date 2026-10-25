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
    path: '**',
    redirectTo: ''
  }
];