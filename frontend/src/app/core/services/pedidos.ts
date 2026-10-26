import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Paginado } from '../models/api.model';
import { Avaliacao } from '../models/dashboard.model';
import { Pedido, StatusPedido } from '../models/pedido.model';
import { parametros } from '../http/parametros';

export interface NovoPedido {
  pontoRetiradaId: number;
  itens: { produtoId: number; quantidade: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class Pedidos {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  criar(pedido: NovoPedido): Observable<Pedido> {
    return this.http.post<Pedido>(`${this.api}/orders`, pedido);
  }

  listarMeusPedidos(status?: StatusPedido): Observable<Paginado<Pedido>> {
    return this.listar('/orders/my', status);
  }

  listarDoProdutor(status?: StatusPedido): Observable<Paginado<Pedido>> {
    return this.listar('/producer/orders', status);
  }

  // Sem status: o que está a caminho do ponto, no ponto ou já retirado.
  listarDoPonto(status?: StatusPedido): Observable<Paginado<Pedido>> {
    return this.listar('/attendant/orders', status);
  }

  aceitar(id: number): Observable<Pedido> {
    return this.http.patch<Pedido>(`${this.api}/orders/${id}/accept`, {});
  }

  rejeitar(id: number, motivo?: string): Observable<Pedido> {
    return this.http.patch<Pedido>(`${this.api}/orders/${id}/reject`, {
      motivo: motivo?.trim() || undefined
    });
  }

  atualizarStatus(id: number, status: 'EM_PRODUCAO' | 'PRONTO_PARA_ENTREGA'): Observable<Pedido> {
    return this.http.patch<Pedido>(`${this.api}/orders/${id}/status`, { status });
  }

  cancelar(id: number): Observable<Pedido> {
    return this.http.patch<Pedido>(`${this.api}/orders/${id}/cancel`, {});
  }

  confirmarRecebimento(id: number): Observable<Pedido> {
    return this.http.patch<Pedido>(`${this.api}/orders/${id}/received`, {});
  }

  confirmarRetirada(id: number): Observable<Pedido> {
    return this.http.patch<Pedido>(`${this.api}/orders/${id}/picked-up`, {});
  }

  avaliar(pedidoId: number, produtoId: number, nota: number, comentario?: string): Observable<Avaliacao> {
    return this.http.post<Avaliacao>(`${this.api}/reviews`, {
      pedidoId,
      produtoId,
      nota,
      comentario: comentario?.trim() || undefined
    });
  }

  private listar(caminho: string, status?: StatusPedido): Observable<Paginado<Pedido>> {
    return this.http.get<Paginado<Pedido>>(`${this.api}${caminho}`, {
      params: parametros({ status, porPagina: 50 })
    });
  }
}
