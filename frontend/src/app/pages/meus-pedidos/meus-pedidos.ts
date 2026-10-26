
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { Pedidos } from '../../core/services/pedidos';
import { ItemPedido, NOMES_STATUS_PEDIDO, Pedido, StatusPedido } from '../../core/models/pedido.model';
import { mensagemErro } from '../../core/http/erro-api';

@Component({
  selector: 'app-meus-pedidos',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './meus-pedidos.html',
  styleUrl: './meus-pedidos.scss'
})
export class MeusPedidos {
  private pedidosService = inject(Pedidos);
  private route = inject(ActivatedRoute);

  readonly pedidos = signal<Pedido[]>([]);
  readonly carregando = signal(true);
  readonly erro = signal('');
  readonly mensagem = signal('');
  readonly processandoId = signal<number | null>(null);

  // Pedido recém-criado no checkout, para destacar.
  readonly novoPedidoId = Number(this.route.snapshot.queryParamMap.get('novo')) || null;

  // Formulário de avaliação aberto: "pedidoId-produtoId".
  readonly avaliando = signal<string | null>(null);
  nota = 5;
  comentario = '';

  constructor() {
    if (this.novoPedidoId) {
      this.mensagem.set(`Pedido #${this.novoPedidoId} enviado! O produtor tem até 48 horas para aceitar.`);
    }

    this.carregar();
  }

  carregar(): void {
    this.pedidosService.listarMeusPedidos().subscribe({
      next: resposta => {
        this.pedidos.set(resposta.data);
        this.carregando.set(false);
      },
      error: erro => {
        this.carregando.set(false);
        this.erro.set(mensagemErro(erro, 'Não foi possível carregar seus pedidos.'));
      }
    });
  }

  nomeStatus(status: StatusPedido): string {
    return NOMES_STATUS_PEDIDO[status];
  }

  classeStatus(status: StatusPedido): string {
    switch (status) {
      case 'DISPONIVEL_RETIRADA':
      case 'RETIRADO':
        return 'sucesso';

      case 'REJEITADO':
      case 'CANCELADO':
        return 'erro';

      case 'AGUARDANDO_ACEITACAO':
        return 'pendente';

      default:
        return 'andamento';
    }
  }

  // RN05: antes do aceite, ou aceito com o lote ainda em formação.
  podeCancelar(pedido: Pedido): boolean {
    return (
      pedido.status === 'AGUARDANDO_ACEITACAO' ||
      (pedido.status === 'ACEITO' && pedido.loteStatus === 'EM_FORMACAO')
    );
  }

  cancelar(pedido: Pedido): void {
    if (!confirm(`Deseja cancelar o pedido #${pedido.id}?`)) {
      return;
    }

    this.executar(pedido.id, this.pedidosService.cancelar(pedido.id), 'Pedido cancelado.');
  }

  abrirAvaliacao(pedido: Pedido, item: ItemPedido): void {
    this.avaliando.set(`${pedido.id}-${item.produtoId}`);
    this.nota = 5;
    this.comentario = '';
  }

  enviarAvaliacao(pedido: Pedido, item: ItemPedido): void {
    this.processandoId.set(pedido.id);
    this.erro.set('');

    this.pedidosService.avaliar(pedido.id, item.produtoId, this.nota, this.comentario).subscribe({
      next: () => {
        this.processandoId.set(null);
        this.avaliando.set(null);
        this.mensagem.set(`Obrigado! Sua avaliação de "${item.nome}" foi registrada.`);
        this.carregar();
      },
      error: erro => {
        this.processandoId.set(null);
        this.erro.set(mensagemErro(erro));
      }
    });
  }

  private executar(id: number, acao: ReturnType<Pedidos['cancelar']>, sucesso: string): void {
    this.processandoId.set(id);
    this.erro.set('');
    this.mensagem.set('');

    acao.subscribe({
      next: atualizado => {
        this.processandoId.set(null);
        this.pedidos.update(lista => lista.map(p => (p.id === id ? atualizado : p)));
        this.mensagem.set(sucesso);
      },
      error: erro => {
        this.processandoId.set(null);
        this.erro.set(mensagemErro(erro));
        this.carregar();
      }
    });
  }
}
