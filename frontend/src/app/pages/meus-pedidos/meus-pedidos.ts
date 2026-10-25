
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { Pedidos } from '../../core/services/pedidos';
import { StatusPedido } from '../../core/models/pedido.model';

@Component({
  selector: 'app-meus-pedidos',
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './meus-pedidos.html',
  styleUrl: './meus-pedidos.scss'
})
export class MeusPedidos {
  private pedidosService = inject(Pedidos);

  pedidos = this.pedidosService.listarMeusPedidos();

  nomeStatus(status: StatusPedido): string {
    const nomes: Record<StatusPedido, string> = {
      AGUARDANDO_ACEITACAO: 'Aguardando aceitação',
      ACEITO: 'Pedido aceito',
      EM_PRODUCAO: 'Em produção',
      PRONTO_PARA_ENTREGA: 'Pronto para entrega',
      DISPONIVEL_RETIRADA: 'Disponível para retirada',
      RETIRADO: 'Retirado',
      REJEITADO: 'Rejeitado',
      CANCELADO: 'Cancelado'
    };

    return nomes[status];
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
}
