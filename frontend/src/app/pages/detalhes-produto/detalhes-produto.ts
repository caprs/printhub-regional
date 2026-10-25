import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Produtos } from '../../core/services/produtos';

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
  private produtosService = inject(Produtos);

  produto = this.produtosService.buscarPorId(
    Number(this.route.snapshot.paramMap.get('id'))
  );

  quantidade = 1;

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
}