import { Injectable } from '@angular/core';
import { Produto } from '../models/produto.model';

@Injectable({
  providedIn: 'root'
})
export class Produtos {
  private readonly produtos: Produto[] = [
    {
      id: 1,
      produtorId: 1,
      nome: 'Organizador de mesa',
      descricao: 'Organizador impresso em 3D para guardar objetos e acessórios de escritório.',
      categoria: 'Organização',
      material: 'PLA',
      preco: 35,
      produtor: 'Produtor Exemplo A',
      imagem: 'https://placehold.co/600x400/e8eefc/2563eb?text=Organizador+3D',
      estoque: 10,
      prazoProducao: 3
    },
    {
      id: 2,
      produtorId: 2,
      nome: 'Suporte para celular',
      descricao: 'Suporte para celular produzido em impressão 3D, ideal para mesas e escritórios.',
      categoria: 'Acessórios',
      material: 'PLA',
      preco: 22,
      produtor: 'Produtor Exemplo B',
      imagem: 'https://placehold.co/600x400/e8eefc/2563eb?text=Suporte+3D',
      estoque: 15,
      prazoProducao: 2
    },
    {
      id: 3,
      produtorId: 1,
      nome: 'Vaso geométrico',
      descricao: 'Vaso decorativo com formato geométrico, produzido por impressão 3D.',
      categoria: 'Decoração',
      material: 'PETG',
      preco: 48,
      produtor: 'Produtor Exemplo A',
      imagem: 'https://placehold.co/600x400/e8eefc/2563eb?text=Vaso+3D',
      estoque: 8,
      prazoProducao: 4
    },
    {
      id: 4,
      produtorId: 3,
      nome: 'Porta-chaves de parede',
      descricao: 'Porta-chaves compacto para organizar chaves e pequenos acessórios.',
      categoria: 'Utilidades',
      material: 'PLA',
      preco: 29.90,
      produtor: 'Produtor Exemplo C',
      imagem: 'https://placehold.co/600x400/e8eefc/2563eb?text=Porta-chaves',
      estoque: 12,
      prazoProducao: 2
    }
  ];

  listar(): Produto[] {
    return this.produtos;
  }

  buscarPorId(id: number): Produto | undefined {
    return this.produtos.find(produto => produto.id === id);
  }
}