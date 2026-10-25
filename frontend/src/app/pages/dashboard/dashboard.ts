
import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { Produtos } from '../../core/services/produtos';
import { Pedidos } from '../../core/services/pedidos';
import { PontosRetirada } from '../../core/services/pontos-retirada';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
  private produtosService = inject(Produtos);
  private pedidosService = inject(Pedidos);
  private pontosService = inject(PontosRetirada);

  readonly totalProdutos = computed(
    () => this.produtosService.listaProdutos().length
  );

  readonly pedidos = this.pedidosService.listarMeusPedidos();

  readonly totalPedidos = this.pedidos.length;

  readonly pedidosEmAndamento = this.pedidos.filter(
    pedido => !['RETIRADO', 'REJEITADO', 'CANCELADO'].includes(pedido.status)
  ).length;

  readonly pontosAtivos = computed(() =>
  this.pontosService.listaPontos().filter(ponto => ponto.ativo).length
);

  readonly lotesDemonstrativos = [
    {
      codigo: 'LOTE-001',
      ponto: 'Ponto Centro',
      pedidos: 3,
      capacidade: 3,
      status: 'Fechado',
      custoEntrega: 18
    },
    {
      codigo: 'LOTE-002',
      ponto: 'Ponto Bairro',
      pedidos: 2,
      capacidade: 3,
      status: 'Em formação',
      custoEntrega: 24
    }
  ];

  readonly totalLotes = this.lotesDemonstrativos.length;
}
