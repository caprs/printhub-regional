
import { Injectable } from '@angular/core';
import { PontoRetirada } from '../models/ponto-retirada.model';

@Injectable({
  providedIn: 'root'
})
export class PontosRetirada {
  private readonly pontos: PontoRetirada[] = [
    {
      id: 1,
      nome: 'Ponto Centro',
      endereco: 'Endereço demonstrativo — Centro',
      bairro: 'Centro',
      cidade: 'Ourinhos - SP',
      custoEntrega: 18,
      ativo: true
    },
    {
      id: 2,
      nome: 'Ponto Bairro',
      endereco: 'Endereço demonstrativo — Bairro',
      bairro: 'Bairro demonstrativo',
      cidade: 'Ourinhos - SP',
      custoEntrega: 24,
      ativo: true
    }
  ];

  listarAtivos(): PontoRetirada[] {
    return this.pontos.filter(ponto => ponto.ativo);
  }
}
