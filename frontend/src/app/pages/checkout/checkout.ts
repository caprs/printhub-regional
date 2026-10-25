
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';

import { Carrinho } from '../../core/services/carrinho';
import { PontosRetirada } from '../../core/services/pontos-retirada';

@Component({
  selector: 'app-checkout',
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatRadioModule,
    MatIconModule
  ],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss'
})
export class Checkout {
  carrinho = inject(Carrinho);
  private pontosService = inject(PontosRetirada);

  pontos = this.pontosService.listarAtivos();
  pontoSelecionadoId: number | null = null;

  get pontoSelecionado() {
    return this.pontos.find(
      ponto => ponto.id === this.pontoSelecionadoId
    );
  }

  get taxaEstimada(): number {
    if (!this.pontoSelecionado) {
      return 0;
    }

    // Simulação: lote com três pedidos.
    return this.pontoSelecionado.custoEntrega / 3;
  }

  get totalEstimado(): number {
    return this.carrinho.subtotal() + this.taxaEstimada;
  }

  selecionarPonto(id: number): void {
    this.pontoSelecionadoId = id;
    this.confirmacaoVisivel = false;
  }

  confirmacaoVisivel = false;

mostrarConfirmacao(): void {
  if (!this.pontoSelecionado || this.carrinho.itens().length === 0) {
    return;
  }

  this.confirmacaoVisivel = true;
}
}

