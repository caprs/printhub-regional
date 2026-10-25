
import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';

import { Produtos } from '../../core/services/produtos';
import { Produto } from '../../core/models/produto.model';
import {
  PedidosProdutor,
  StatusPedidoProdutor
} from '../../core/services/pedidos-produtor';

@Component({
  selector: 'app-painel-produtor',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule
  ],
  templateUrl: './painel-produtor.html',
  styleUrl: './painel-produtor.scss'
})
export class PainelProdutor {
  private produtosService = inject(Produtos);

  // Produtor demonstrativo até implementarmos a autenticação.
  readonly produtorId = 1;
  readonly produtorNome = 'Produtor Exemplo A';

  readonly meusProdutos = computed(() =>
    this.produtosService.listaProdutos().filter(
      produto => produto.produtorId === this.produtorId
    )
  );

  readonly formularioAberto = signal(false);

  produtoEditandoId: number | null = null;
  mensagem = '';

  categorias = [
    'Organização',
    'Acessórios',
    'Decoração',
    'Utilidades'
  ];

  formulario = this.formularioVazio();

  private formularioVazio() {
    return {
      nome: '',
      descricao: '',
      categoria: 'Organização',
      material: 'PLA',
      preco: 0,
      estoque: 0,
      prazoProducao: 1,
      imagem: ''
    };
  }

  novoProduto(): void {
    this.produtoEditandoId = null;
    this.formulario = this.formularioVazio();
    this.mensagem = '';
    this.formularioAberto.set(true);
  }

  editarProduto(produto: Produto): void {
    this.produtoEditandoId = produto.id;

    this.formulario = {
      nome: produto.nome,
      descricao: produto.descricao,
      categoria: produto.categoria,
      material: produto.material,
      preco: produto.preco,
      estoque: produto.estoque,
      prazoProducao: produto.prazoProducao,
      imagem: produto.imagem
    };

    this.mensagem = '';
    this.formularioAberto.set(true);
  }

  cancelar(): void {
    this.formularioAberto.set(false);
    this.produtoEditandoId = null;
  }

  salvar(): void {
    const dados = this.formulario;

    if (
      !dados.nome.trim() ||
      !dados.descricao.trim() ||
      !dados.imagem.trim() ||
      !dados.material.trim() ||
      !dados.categoria ||
      !Number.isFinite(dados.preco) ||
      dados.preco <= 0 ||
      !Number.isInteger(dados.estoque) ||
      dados.estoque < 0 ||
      !Number.isInteger(dados.prazoProducao) ||
      dados.prazoProducao < 1
    ) {
      this.mensagem = 'Preencha os campos corretamente.';
      return;
    }

    if (this.produtoEditandoId !== null) {
      this.produtosService.editar(this.produtoEditandoId, dados);
      this.mensagem = 'Produto atualizado com sucesso!';
    } else {
      this.produtosService.cadastrar({
        ...dados,
        produtorId: this.produtorId,
        produtor: this.produtorNome
      });

      this.mensagem = 'Produto cadastrado com sucesso!';
    }

    this.produtoEditandoId = null;
    this.formularioAberto.set(false);
  }

  excluirProduto(produto: Produto): void {
    const confirmou = confirm(
      `Deseja realmente excluir "${produto.nome}"?`
    );

    if (!confirmou) {
      return;
    }

    this.produtosService.excluir(produto.id);
    this.mensagem = 'Produto excluído com sucesso!';
  }

  
private pedidosProdutorService = inject(PedidosProdutor);

readonly pedidosRecebidos = computed(() =>
  this.pedidosProdutorService.pedidos().filter(
    pedido => pedido.produtorId === this.produtorId
  )
);

mensagemPedido = '';

nomeStatusPedido(status: StatusPedidoProdutor): string {
  const nomes: Record<StatusPedidoProdutor, string> = {
    AGUARDANDO_ACEITACAO: 'Aguardando aceitação',
    ACEITO: 'Aceito',
    EM_PRODUCAO: 'Em produção',
    PRONTO_PARA_ENTREGA: 'Pronto para entrega',
    REJEITADO: 'Rejeitado'
  };

  return nomes[status];
}

atualizarStatusPedido(
  pedidoId: number,
  novoStatus: StatusPedidoProdutor
): void {
  const atualizado = this.pedidosProdutorService.atualizarStatus(
    pedidoId,
    this.produtorId,
    novoStatus
  );

  this.mensagemPedido = atualizado
    ? 'Status do pedido atualizado com sucesso!'
    : 'Não foi possível atualizar o pedido.';
}

}
