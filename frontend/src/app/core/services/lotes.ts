import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Paginado } from '../models/api.model';
import { Lote, StatusLote } from '../models/lote.model';
import { parametros } from '../http/parametros';

@Injectable({
  providedIn: 'root'
})
export class Lotes {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/batches`;

  listar(filtros: { status?: StatusLote; pontoRetiradaId?: number; porPagina?: number } = {}): Observable<Paginado<Lote>> {
    return this.http.get<Paginado<Lote>>(this.url, {
      params: parametros({ porPagina: 50, ...filtros })
    });
  }
}
