
import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { Lotes } from '../../core/services/lotes';
import { Lote, NOMES_STATUS_LOTE, StatusLote } from '../../core/models/lote.model';
import { mensagemErro } from '../../core/http/erro-api';

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

  readonly lotes = signal<Lote[]>([]);
  readonly carregando = signal(true);
  readonly erro = signal('');

  readonly totalLotes = computed(() => this.lotes().length);

  readonly lotesEmFormacao = computed(() =>
    this.lotes().filter(lote => lote.status === 'EM_FORMACAO').length
  );

  // Todos os que já saíram da formação (inclui concluídos).
  readonly lotesFechados = computed(() =>
    this.lotes().filter(lote => lote.status !== 'EM_FORMACAO').length
  );

  constructor() {
    this.lotesService.listar().subscribe({
      next: resposta => {
        this.lotes.set(resposta.data);
        this.carregando.set(false);
      },
      error: erro => {
        this.carregando.set(false);
        this.erro.set(mensagemErro(erro, 'Não foi possível carregar os lotes.'));
      }
    });
  }

  nomeStatus(status: StatusLote): string {
    return NOMES_STATUS_LOTE[status];
  }

  progresso(lote: Lote): number {
    return Math.min((lote.quantidadePedidos / lote.capacidade) * 100, 100);
  }
}
