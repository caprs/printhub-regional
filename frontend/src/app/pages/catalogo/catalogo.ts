
import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

import { Produto } from '../../core/models/produto.model';
import { Produtos } from '../../core/services/produtos';

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

readonly produtos = this.produtosService.listaProdutos;
  busca = '';
  categoriaSelecionada = 'Todas';

  categorias = [
    'Todas',
    'Organização',
    'Acessórios',
    'Decoração',
    'Utilidades'
  ];

  get produtosFiltrados(): Produto[] {
    const termo = this.busca.trim().toLowerCase();

    return this.produtos().filter(produto => {
      const correspondeBusca =
        produto.nome.toLowerCase().includes(termo) ||
        produto.material.toLowerCase().includes(termo);

      const correspondeCategoria =
        this.categoriaSelecionada === 'Todas' ||
        produto.categoria === this.categoriaSelecionada;

      return correspondeBusca && correspondeCategoria;
    });
  }
}
