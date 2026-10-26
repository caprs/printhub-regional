
import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { Auth } from '../../core/services/auth';
import { Administracao } from '../../core/services/administracao';
import { Lotes } from '../../core/services/lotes';
import { IndicadoresDashboard } from '../../core/models/dashboard.model';
import { Lote, NOMES_STATUS_LOTE, StatusLote } from '../../core/models/lote.model';
import { NOMES_STATUS_PEDIDO, StatusPedido } from '../../core/models/pedido.model';
import { mensagemErro } from '../../core/http/erro-api';

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
  private auth = inject(Auth);
  private administracao = inject(Administracao);
  private lotesService = inject(Lotes);

  readonly ehProdutor = this.auth.temPerfil('PRODUTOR');

  readonly indicadores = signal<IndicadoresDashboard | null>(null);
  readonly lotes = signal<Lote[]>([]);
  readonly erro = signal('');

  // Pedidos por status, na ordem do fluxo, só os que têm algum pedido.
  readonly pedidosPorStatus = computed(() => {
    const porStatus = this.indicadores()?.pedidos.porStatus ?? {};

    return (Object.keys(NOMES_STATUS_PEDIDO) as StatusPedido[])
      .filter(status => (porStatus[status] ?? 0) > 0)
      .map(status => ({ nome: NOMES_STATUS_PEDIDO[status], quantidade: porStatus[status] ?? 0 }));
  });

  constructor() {
    this.administracao.dashboard().subscribe({
      next: indicadores => this.indicadores.set(indicadores),
      error: erro => this.erro.set(mensagemErro(erro, 'Não foi possível carregar os indicadores.'))
    });

    this.lotesService.listar({ porPagina: 6 }).subscribe({
      next: resposta => this.lotes.set(resposta.data)
    });
  }

  nomeStatusLote(status: StatusLote): string {
    return NOMES_STATUS_LOTE[status];
  }
}
