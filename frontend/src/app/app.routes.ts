import { Routes } from '@angular/router';

import { exigirPerfil } from './core/guards/perfil.guard';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./pages/catalogo/catalogo.module').then(m => m.CatalogoModule),
    title: 'PrintHub Regional | Catálogo'
  },
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then(m => m.LoginModule),
    title: 'PrintHub Regional | Login'
  },
  {
    path: 'cadastro',
    loadChildren: () => import('./pages/cadastro/cadastro.module').then(m => m.CadastroModule),
    title: 'PrintHub Regional | Cadastro'
  },
  {
    path: 'recuperar-senha',
    loadChildren: () => import('./pages/recuperar-senha/recuperar-senha.module').then(m => m.RecuperarSenhaModule),
    title: 'PrintHub Regional | Recuperar senha'
  },
  {
    path: 'carrinho',
    loadChildren: () => import('./pages/carrinho/carrinho.module').then(m => m.CarrinhoModule),
    title: 'PrintHub Regional | Carrinho'
  },
  {
    path: 'meus-pedidos',
    canActivate: [exigirPerfil()],
    loadChildren: () => import('./pages/meus-pedidos/meus-pedidos.module').then(m => m.MeusPedidosModule),
    title: 'PrintHub Regional | Meus pedidos'
  },
  {
  path: 'produto/:id',
  loadChildren: () => import('./pages/detalhes-produto/detalhes-produto.module').then(m => m.DetalhesProdutoModule),
  title: 'PrintHub Regional | Detalhes do produto'
},
{
  path: 'checkout',
  canActivate: [exigirPerfil('CONSUMIDOR', 'PRODUTOR')],
  loadChildren: () => import('./pages/checkout/checkout.module').then(m => m.CheckoutModule),
  title: 'PrintHub Regional | Finalizar pedido'
},
{
  path: 'painel-produtor',
  canActivate: [exigirPerfil('PRODUTOR')],
  loadChildren: () => import('./pages/painel-produtor/painel-produtor.module').then(m => m.PainelProdutorModule),
  title: 'PrintHub Regional | Painel do produtor'
},
{
  path: 'ponto-retirada',
  canActivate: [exigirPerfil('ATENDENTE')],
  loadChildren: () => import('./pages/ponto-retirada/ponto-retirada.module').then(m => m.PontoRetiradaModule),
  title: 'PrintHub Regional | Ponto de retirada'
},
{
  path: 'dashboard',
  canActivate: [exigirPerfil('ADMINISTRADOR', 'PRODUTOR')],
  loadChildren: () => import('./pages/dashboard/dashboard.module').then(m => m.DashboardModule),
  title: 'PrintHub Regional | Dashboard'
},
{
  path: 'gerenciar-pontos',
  canActivate: [exigirPerfil('ADMINISTRADOR')],
  loadChildren: () => import('./pages/gerenciar-pontos/gerenciar-pontos.module').then(m => m.GerenciarPontosModule),
  title: 'PrintHub Regional | Gerenciar pontos de retirada'
},
{
  path: 'administracao',
  canActivate: [exigirPerfil('ADMINISTRADOR')],
  loadChildren: () => import('./pages/administracao/administracao.module').then(m => m.AdministracaoModule),
  title: 'PrintHub Regional | Usuários e registros'
},
{
  path: 'lotes',
  canActivate: [exigirPerfil()],
  loadChildren: () => import('./pages/lotes/lotes.module').then(m => m.LotesModule),
  title: 'PrintHub Regional | Lotes coletivos'
},
  {
    path: '**',
    redirectTo: ''
  }
];
