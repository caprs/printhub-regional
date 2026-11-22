
import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';

import { Carrinho } from '../../core/services/carrinho';
import { PontosRetirada } from '../../core/services/pontos-retirada';
import { Pedidos } from '../../core/services/pedidos';
import { PontoRetirada } from '../../core/models/ponto-retirada.model';
import { mensagemErro } from '../../core/http/erro-api';

@Component({
  standalone: false,
  selector: 'app-checkout',
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss'
})
export class Checkout {
  carrinho = inject(Carrinho);
  private pontosService = inject(PontosRetirada);
  private pedidosService = inject(Pedidos);
  private router = inject(Router);

  readonly pontos = signal<PontoRetirada[]>([]);
  readonly pontoSelecionadoId = signal<number | null>(null);
  readonly carregando = signal(true);
  readonly enviando = signal(false);
  readonly erro = signal('');
  readonly confirmacaoVisivel = signal(false);

  readonly pontoSelecionado = computed(() =>
    this.pontos().find(ponto => ponto.id === this.pontoSelecionadoId())
  );

  // A taxa definitiva só sai quando o lote fecha; aqui mostramos o máximo.
  readonly taxaEstimada = computed(() => this.pontoSelecionado()?.taxaEstimada.maxima ?? 0);

  readonly totalEstimado = computed(() => this.carrinho.subtotal() + this.taxaEstimada());

  constructor() {
    this.pontosService.listar().subscribe({
      next: pontos => {
        this.pontos.set(pontos);
        this.carregando.set(false);
      },
      error: erro => {
        this.carregando.set(false);
        this.erro.set(mensagemErro(erro, 'Não foi possível carregar os pontos de retirada.'));
      }
    });
  }

  selecionarPonto(id: number): void {
    this.pontoSelecionadoId.set(id);
    this.confirmacaoVisivel.set(false);
  }

  mostrarConfirmacao(): void {
    if (!this.pontoSelecionado() || this.carrinho.itens().length === 0) {
      return;
    }

    this.confirmacaoVisivel.set(true);
  }

  confirmarPedido(): void {
    const ponto = this.pontoSelecionado();

    if (!ponto || this.enviando()) {
      return;
    }

    this.erro.set('');
    this.enviando.set(true);

    this.pedidosService
      .criar({
        pontoRetiradaId: ponto.id,
        itens: this.carrinho.itens().map(item => ({
          produtoId: item.produto.id,
          quantidade: item.quantidade
        }))
      })
      .subscribe({
        next: pedido => {
          this.enviando.set(false);
          this.carrinho.limpar();
          this.router.navigate(['/meus-pedidos'], { queryParams: { novo: pedido.id } });
        },
        error: erro => {
          this.enviando.set(false);
          this.confirmacaoVisivel.set(false);
          this.erro.set(mensagemErro(erro, 'Não foi possível finalizar o pedido.'));
        }
      });
  }
}
