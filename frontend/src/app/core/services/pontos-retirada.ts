
import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { PontoRetirada } from '../models/ponto-retirada.model';

@Injectable({
  providedIn: 'root'
})
export class PontosRetirada {

  private readonly platformId = inject(PLATFORM_ID);
  private readonly chaveStorage = 'printhub-pontos-retirada';

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

  private readonly pontosSignal = signal<PontoRetirada[]>(this.pontos);

  readonly listaPontos = this.pontosSignal.asReadonly();

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const dadosSalvos = localStorage.getItem(this.chaveStorage);

      if (dadosSalvos) {
        try {
          const pontosSalvos = JSON.parse(dadosSalvos);

          if (Array.isArray(pontosSalvos)) {
            this.pontosSignal.set(pontosSalvos);
          }
        } catch {
          console.warn('Não foi possível recuperar os pontos salvos.');
        }
      }
    }
  }

  private salvarNoNavegador(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(
        this.chaveStorage,
        JSON.stringify(this.pontosSignal())
      );
    }
  }

  listar(): PontoRetirada[] {
    return this.pontosSignal();
  }

  listarAtivos(): PontoRetirada[] {
    return this.pontosSignal().filter(ponto => ponto.ativo);
  }

  cadastrar(dados: Omit<PontoRetirada, 'id'>): void {
    const novoId = Math.max(
      0,
      ...this.pontosSignal().map(ponto => ponto.id)
    ) + 1;

    this.pontosSignal.update(pontos => [
      ...pontos,
      { ...dados, id: novoId }
    ]);

    this.salvarNoNavegador();
  }

  editar(id: number, dados: Partial<PontoRetirada>): void {
    this.pontosSignal.update(pontos =>
      pontos.map(ponto =>
        ponto.id === id
          ? { ...ponto, ...dados, id: ponto.id }
          : ponto
      )
    );

    this.salvarNoNavegador();
  }

  alternarStatus(id: number): void {
    this.pontosSignal.update(pontos =>
      pontos.map(ponto =>
        ponto.id === id
          ? { ...ponto, ativo: !ponto.ativo }
          : ponto
      )
    );

    this.salvarNoNavegador();
  }
}
