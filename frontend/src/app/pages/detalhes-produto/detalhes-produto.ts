
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Produtos } from '../../core/services/produtos';
import { Carrinho } from '../../core/services/carrinho';

@Component({
  selector: 'app-detalhes-produto',
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './detalhes-produto.html',
  styleUrl: './detalhes-produto.scss'
})
export class DetalhesProduto {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private produtosService = inject(Produtos);
  private carrinhoService = inject(Carrinho);

  produto = this.produtosService.buscarPorId(
    Number(this.route.snapshot.paramMap.get('id'))
  );

  quantidade = 1;
  mensagemErro = '';

  aumentar(): void {
    if (this.produto && this.quantidade < this.produto.estoque) {
      this.quantidade++;
    }
  }

  diminuir(): void {
    if (this.quantidade > 1) {
      this.quantidade--;
    }
  }

  adicionarAoCarrinho(): void {
    if (!this.produto) {
      return;
    }

    const erro = this.carrinhoService.adicionar(
      this.produto,
      this.quantidade
    );

    if (erro) {
      this.mensagemErro = erro;
      return;
    }

    this.mensagemErro = '';
    this.router.navigate(['/carrinho']);
  }
}
