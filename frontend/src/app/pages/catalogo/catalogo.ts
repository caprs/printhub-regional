
import { Component, inject, computed, signal } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, switchMap, tap, catchError, of } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

import { FiltrosProduto, Produto } from '../../core/models/produto.model';
import { Produtos } from '../../core/services/produtos';
import { mensagemErro } from '../../core/http/erro-api';

@Component({
  selector: 'app-catalogo',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule
  ],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.scss'
})
export class Catalogo {

  private produtosService = inject(Produtos);

  readonly busca = signal('');
  readonly categoriaSelecionada = signal('Todas');
  readonly materialSelecionado = signal('Todos');
  readonly ordenar = signal<'recentes' | 'preco_asc' | 'preco_desc'>('recentes');

  readonly produtos = signal<Produto[]>([]);
  readonly total = signal(0);
  readonly carregando = signal(true);
  readonly erro = signal('');

  categorias = [
    'Todas',
    'Organização',
    'Acessórios',
    'Decoração',
    'Utilidades'
  ];

  materiais = ['Todos', 'PLA', 'PETG', 'ABS', 'TPU', 'Resina'];

  // A busca e os filtros são aplicados pela API.
  private readonly filtros = computed<FiltrosProduto>(() => ({
    busca: this.busca().trim() || undefined,
    categoria: this.categoriaSelecionada() === 'Todas' ? undefined : this.categoriaSelecionada(),
    material: this.materialSelecionado() === 'Todos' ? undefined : this.materialSelecionado(),
    ordenar: this.ordenar(),
    porPagina: 50
  }));

  constructor() {
    toObservable(this.filtros)
      .pipe(
        // Espera o usuário parar de digitar antes de consultar.
        debounceTime(300),
        tap(() => this.carregando.set(true)),
        switchMap(filtros =>
          this.produtosService.listar(filtros).pipe(
            catchError(erro => {
              this.erro.set(mensagemErro(erro, 'Não foi possível carregar o catálogo.'));
              return of(null);
            })
          )
        ),
        takeUntilDestroyed()
      )
      .subscribe(resposta => {
        this.carregando.set(false);

        if (resposta) {
          this.erro.set('');
          this.produtos.set(resposta.data);
          this.total.set(resposta.meta.total);
        }
      });
  }
}
