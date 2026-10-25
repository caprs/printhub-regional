
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Carrinho as CarrinhoService } from '../../core/services/carrinho';

@Component({
  selector: 'app-carrinho',
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './carrinho.html',
  styleUrl: './carrinho.scss'
})
export class Carrinho {
  carrinho = inject(CarrinhoService);

  mensagemErro = '';

  aumentar(produtoId: number): void {
    this.mensagemErro = this.carrinho.aumentar(produtoId) ?? '';
  }

  diminuir(produtoId: number): void {
    this.carrinho.diminuir(produtoId);
    this.mensagemErro = '';
  }

  remover(produtoId: number): void {
    this.carrinho.remover(produtoId);
    this.mensagemErro = '';
  }
}
