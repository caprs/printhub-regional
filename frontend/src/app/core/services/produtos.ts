import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Paginado } from '../models/api.model';
import { Avaliacao } from '../models/dashboard.model';
import { DadosProduto, FiltrosProduto, Produto } from '../models/produto.model';
import { parametros } from '../http/parametros';

export type AvaliacoesProduto = Paginado<Avaliacao> & {
  resumo: { notaMedia: number | null; totalAvaliacoes: number };
};

@Injectable({
  providedIn: 'root'
})
export class Produtos {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/products`;

  listar(filtros: FiltrosProduto = {}): Observable<Paginado<Produto>> {
    return this.http.get<Paginado<Produto>>(this.url, { params: parametros(filtros) });
  }

  buscarPorId(id: number): Observable<Produto> {
    return this.http.get<Produto>(`${this.url}/${id}`);
  }

  // Produtos do produtor logado, inclusive os desativados.
  listarMeus(): Observable<Paginado<Produto>> {
    return this.http.get<Paginado<Produto>>(`${environment.apiUrl}/producers/me/products`, {
      params: parametros({ porPagina: 50 })
    });
  }

  cadastrar(dados: DadosProduto): Observable<Produto> {
    return this.http.post<Produto>(this.url, dados);
  }

  editar(id: number, dados: Partial<DadosProduto> & { ativo?: boolean }): Observable<Produto> {
    return this.http.patch<Produto>(`${this.url}/${id}`, dados);
  }

  // A API desativa o produto (ele pode estar em pedidos antigos).
  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  avaliacoes(id: number): Observable<AvaliacoesProduto> {
    return this.http.get<AvaliacoesProduto>(`${this.url}/${id}/reviews`);
  }
}
