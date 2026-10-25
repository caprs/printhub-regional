
import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { Lotes } from '../../core/services/lotes';
import { StatusLote } from '../../core/models/lote.model';

@Component({
  selector: 'app-lotes',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './lotes.html',
  styleUrl: './lotes.scss'
})
export class LotesPage {
  private lotesService = inject(Lotes);

  readonly lotes = this.lotesService.lotes;

  readonly totalLotes = computed(() => this.lotes().length);

  readonly lotesEmFormacao = computed(() =>
    this.lotes().filter(lote => lote.status === 'EM_FORMACAO').length
  );

  readonly lotesFechados = computed(() =>
    this.lotes().filter(lote => lote.status === 'FECHADO').length
  );

  nomeStatus(status: StatusLote): string {
    const nomes: Record<StatusLote, string> = {
      EM_FORMACAO: 'Em formação',
      FECHADO: 'Fechado',
      AGUARDANDO_PRODUCAO: 'Aguardando produção',
      PRONTO_PARA_ENTREGA: 'Pronto para entrega',
      CONCLUIDO: 'Concluído'
    };

    return nomes[status];
  }

  estimativaEntrega(custo: number, pedidos: number): number {
    return pedidos > 0 ? custo / pedidos : 0;
  }

  progresso(pedidos: number): number {
    return Math.min((pedidos / 3) * 100, 100);
  }
}
