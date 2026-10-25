
import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import {
  Atendimento,
  StatusRetirada
} from '../../core/services/atendimento';

@Component({
  selector: 'app-ponto-retirada',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './ponto-retirada.html',
  styleUrl: './ponto-retirada.scss'
})
export class PontoRetirada {
  private atendimentoService = inject(Atendimento);

  // Ponto demonstrativo até implementarmos o login do atendente.
  readonly pontoRetiradaId = 1;
  readonly nomePonto = 'Ponto Centro';

  readonly pedidos = computed(() =>
    this.atendimentoService.pedidos().filter(
      pedido => pedido.pontoRetiradaId === this.pontoRetiradaId
    )
  );

  mensagem = '';

  nomeStatus(status: StatusRetirada): string {
    const nomes: Record<StatusRetirada, string> = {
      AGUARDANDO_RECEBIMENTO: 'Aguardando recebimento',
      DISPONIVEL_RETIRADA: 'Disponível para retirada',
      RETIRADO: 'Retirado'
    };

    return nomes[status];
  }

  atualizarStatus(
    pedidoId: number,
    status: StatusRetirada
  ): void {
    const atualizado = this.atendimentoService.atualizarStatus(
      pedidoId,
      this.pontoRetiradaId,
      status
    );

    this.mensagem = atualizado
      ? 'Status atualizado com sucesso!'
      : 'Não foi possível atualizar o pedido.';
  }
}
