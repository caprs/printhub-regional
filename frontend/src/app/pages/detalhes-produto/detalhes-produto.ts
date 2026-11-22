
import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { Produtos } from '../../core/services/produtos';
import { Carrinho } from '../../core/services/carrinho';
import { Auth } from '../../core/services/auth';
import { Produto } from '../../core/models/produto.model';
import { Avaliacao } from '../../core/models/dashboard.model';
import { mensagemErro } from '../../core/http/erro-api';

@Component({
  standalone: false,
  selector: 'app-detalhes-produto',
  templateUrl: './detalhes-produto.html',
  styleUrl: './detalhes-produto.scss'
})
export class DetalhesProduto {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private produtosService = inject(Produtos);
  private carrinhoService = inject(Carrinho);
  private auth = inject(Auth);

  readonly produto = signal<Produto | null>(null);
  readonly avaliacoes = signal<Avaliacao[]>([]);
  readonly carregando = signal(true);
  readonly erroCarregar = signal('');

  quantidade = 1;
  mensagemErro = '';

  // RN09: produtor não compra o próprio produto; atendente e admin não compram.
  readonly motivoSemCompra = computed(() => {
    const produto = this.produto();

    if (!this.auth.logado() || !produto) {
      return '';
    }

    if (this.auth.usuario()?.id === produto.produtorId) {
      return 'Este produto é seu. Você pode editá-lo no Painel do produtor.';
    }

    if (!this.auth.temPerfil('CONSUMIDOR', 'PRODUTOR')) {
      return 'Compras são feitas por contas de consumidor ou produtor.';
    }

    return '';
  });

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.produtosService.buscarPorId(id).subscribe({
      next: produto => {
        this.produto.set(produto);
        this.carregando.set(false);
      },
      error: erro => {
        this.carregando.set(false);
        // 404 cai na mensagem "Produto não encontrado" do template.
        if (erro.status !== 404 && erro.status !== 400) {
          this.erroCarregar.set(mensagemErro(erro));
        }
      }
    });

    this.produtosService.avaliacoes(id).subscribe({
      next: resposta => this.avaliacoes.set(resposta.data),
      error: () => this.avaliacoes.set([])
    });
  }

  aumentar(): void {
    const produto = this.produto();

    if (produto && this.quantidade < produto.estoque) {
      this.quantidade++;
    }
  }

  diminuir(): void {
    if (this.quantidade > 1) {
      this.quantidade--;
    }
  }

  adicionarAoCarrinho(): void {
    const produto = this.produto();

    if (!produto) {
      return;
    }

    const erro = this.carrinhoService.adicionar(produto, this.quantidade);

    if (erro) {
      this.mensagemErro = erro;
      return;
    }

    this.mensagemErro = '';
    this.router.navigate(['/carrinho']);
  }
}
