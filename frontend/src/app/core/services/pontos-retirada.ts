import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { DadosPonto, PontoRetirada } from '../models/ponto-retirada.model';
import { parametros } from '../http/parametros';

@Injectable({
  providedIn: 'root'
})
export class PontosRetirada {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/pickup-points`;

  // todos = true só tem efeito para o administrador (inclui inativos).
  listar(todos = false): Observable<PontoRetirada[]> {
    return this.http.get<PontoRetirada[]>(this.url, {
      params: parametros({ todos: todos || undefined })
    });
  }

  buscarPorId(id: number): Observable<PontoRetirada> {
    return this.http.get<PontoRetirada>(`${this.url}/${id}`);
  }

  cadastrar(dados: DadosPonto): Observable<PontoRetirada> {
    return this.http.post<PontoRetirada>(this.url, dados);
  }

  editar(id: number, dados: Partial<DadosPonto>): Observable<PontoRetirada> {
    return this.http.patch<PontoRetirada>(`${this.url}/${id}`, dados);
  }
}
