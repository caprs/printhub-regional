
import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { Auth } from '../../core/services/auth';
import { Pedidos } from '../../core/services/pedidos';
import { PontosRetirada } from '../../core/services/pontos-retirada';
import { Pedido, StatusPedido } from '../../core/models/pedido.model';
import { mensagemErro } from '../../core/http/erro-api';

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
  private auth = inject(Auth);
  private pedidosService = inject(Pedidos);
  private pontosService = inject(PontosRetirada);

  // O ponto vem do vínculo do atendente, validado pela API.
  readonly nomePonto = signal('');
  readonly pedidos = signal<Pedido[]>([]);
  readonly carregando = signal(true);
  readonly mensagem = signal('');
  readonly erro = signal('');
  readonly processandoId = signal<number | null>(null);

  constructor() {
    // Reage quando os dados do usuário chegam (/auth/me pode responder depois).
    effect(() => {
      const pontoId = this.auth.usuario()?.pontoRetiradaId;

      if (pontoId) {
        this.pontosService.buscarPorId(pontoId).subscribe({
          next: ponto => this.nomePonto.set(ponto.nome)
        });
      }
    });

    this.carregar();
  }

  carregar(): void {
    this.pedidosService.listarDoPonto().subscribe({
      next: resposta => {
        this.pedidos.set(resposta.data);
        this.carregando.set(false);
      },
      error: erro => {
        this.carregando.set(false);
        this.erro.set(mensagemErro(erro, 'Não foi possível carregar os pedidos do ponto.'));
      }
    });
  }

  nomeStatus(status: StatusPedido): string {
    const nomes: Partial<Record<StatusPedido, string>> = {
      PRONTO_PARA_ENTREGA: 'Aguardando recebimento',
      DISPONIVEL_RETIRADA: 'Disponível para retirada',
      RETIRADO: 'Retirado'
    };

    return nomes[status] ?? status;
  }

  confirmarRecebimento(pedido: Pedido): void {
    this.executar(pedido, this.pedidosService.confirmarRecebimento(pedido.id), 'recebimento confirmado. O cliente já pode retirar.');
  }

  confirmarRetirada(pedido: Pedido): void {
    const confirmou = confirm(
      `Confirmar que ${pedido.cliente} retirou o pedido #${pedido.id} e pagou ${pedido.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}?`
    );

    if (confirmou) {
      this.executar(pedido, this.pedidosService.confirmarRetirada(pedido.id), 'retirada confirmada.');
    }
  }

  private executar(pedido: Pedido, acao: Observable<Pedido>, sucesso: string): void {
    this.processandoId.set(pedido.id);
    this.mensagem.set('');
    this.erro.set('');

    acao.subscribe({
      next: atualizado => {
        this.processandoId.set(null);
        this.pedidos.update(lista => lista.map(p => (p.id === pedido.id ? atualizado : p)));
        this.mensagem.set(`Pedido #${pedido.id}: ${sucesso}`);
      },
      error: erro => {
        this.processandoId.set(null);
        this.erro.set(mensagemErro(erro));
        this.carregar();
      }
    });
  }
}
