
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

interface Produto {
  id: number;
  nome: string;
  categoria: string;
  material: string;
  preco: number;
  produtor: string;
  imagem: string;
}

@Component({
  selector: 'app-catalogo',
  imports: [
    CommonModule,
    FormsModule,
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
  busca = '';
  categoriaSelecionada = 'Todas';

  categorias = [
    'Todas',
    'Organização',
    'Acessórios',
    'Decoração',
    'Utilidades'
  ];

  // Dados fictícios até a integração com a API.
  produtos: Produto[] = [
    {
      id: 1,
      nome: 'Organizador de mesa',
      categoria: 'Organização',
      material: 'PLA',
      preco: 35,
      produtor: 'Produtor Exemplo A',
      imagem: 'https://placehold.co/600x400/e8eefc/2563eb?text=Organizador+3D'
    },
    {
      id: 2,
      nome: 'Suporte para celular',
      categoria: 'Acessórios',
      material: 'PLA',
      preco: 22,
      produtor: 'Produtor Exemplo B',
      imagem: 'https://placehold.co/600x400/e8eefc/2563eb?text=Suporte+3D'
    },
    {
      id: 3,
      nome: 'Vaso geométrico',
      categoria: 'Decoração',
      material: 'PETG',
      preco: 48,
      produtor: 'Produtor Exemplo A',
      imagem: 'https://placehold.co/600x400/e8eefc/2563eb?text=Vaso+3D'
    },
    {
      id: 4,
      nome: 'Porta-chaves de parede',
      categoria: 'Utilidades',
      material: 'PLA',
      preco: 29.90,
      produtor: 'Produtor Exemplo C',
      imagem: 'https://placehold.co/600x400/e8eefc/2563eb?text=Porta-chaves'
    }
  ];

  get produtosFiltrados(): Produto[] {
    const termo = this.busca.trim().toLowerCase();

    return this.produtos.filter(produto => {
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
