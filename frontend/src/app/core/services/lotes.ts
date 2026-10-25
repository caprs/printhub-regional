
import { Injectable, signal } from '@angular/core';
import { Lote } from '../models/lote.model';

@Injectable({
  providedIn: 'root'
})
export class Lotes {
  private readonly lotesSignal = signal<Lote[]>([
    {
      id: 1,
      codigo: 'LOTE-001',
      pontoRetiradaId: 1,
      pontoRetirada: 'Ponto Centro',
      dataAbertura: '2026-10-20',
      dataLimite: '2026-10-27',
      quantidadePedidos: 3,
      custoEntrega: 18,
      status: 'FECHADO'
    },
    {
      id: 2,
      codigo: 'LOTE-002',
      pontoRetiradaId: 2,
      pontoRetirada: 'Ponto Bairro',
      dataAbertura: '2026-10-23',
      dataLimite: '2026-10-30',
      quantidadePedidos: 2,
      custoEntrega: 24,
      status: 'EM_FORMACAO'
    },
    {
      id: 3,
      codigo: 'LOTE-003',
      pontoRetiradaId: 1,
      pontoRetirada: 'Ponto Centro',
      dataAbertura: '2026-10-24',
      dataLimite: '2026-10-31',
      quantidadePedidos: 1,
      custoEntrega: 18,
      status: 'EM_FORMACAO'
    }
  ]);

  readonly lotes = this.lotesSignal.asReadonly();
}
