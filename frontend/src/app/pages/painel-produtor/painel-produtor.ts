
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';

import { Produtos } from '../../core/services/produtos';
import { Pedidos } from '../../core/services/pedidos';
import { DadosProduto, Produto } from '../../core/models/produto.model';
import { NOMES_STATUS_PEDIDO, Pedido, StatusPedido } from '../../core/models/pedido.model';
import { mensagemErro } from '../../core/http/erro-api';

@Component({
  standalone: false,
  selector: 'app-painel-produtor',
  templateUrl: './painel-produtor.html',
  styleUrl: './painel-produtor.scss'
})
export class PainelProdutor {
  private produtosService = inject(Produtos);
  private pedidosService = inject(Pedidos);

  readonly meusProdutos = signal<Produto[]>([]);
  readonly pedidosRecebidos = signal<Pedido[]>([]);
  readonly carregando = signal(true);

  readonly formularioAberto = signal(false);
  readonly salvando = signal(false);
  readonly mensagem = signal('');
  readonly erro = signal('');
  readonly mensagemPedido = signal('');
  readonly erroPedido = signal('');
  readonly processandoPedidoId = signal<number | null>(null);

  produtoEditandoId: number | null = null;

  categorias = [
    'Organização',
    'Acessórios',
    'Decoração',
    'Utilidades'
  ];

  formulario = this.formularioVazio();

  constructor() {
    this.carregarProdutos();
    this.carregarPedidos();
  }

  private formularioVazio(): DadosProduto {
    return {
      nome: '',
      descricao: '',
      categoria: 'Organização',
      material: 'PLA',
      cor: null,
      preco: 0,
      estoque: 0,
      prazoProducao: 1,
      imagem: ''
    };
  }

  carregarProdutos(): void {
    this.produtosService.listarMeus().subscribe({
      next: resposta => {
        this.meusProdutos.set(resposta.data);
        this.carregando.set(false);
      },
      error: erro => {
        this.carregando.set(false);
        this.erro.set(mensagemErro(erro, 'Não foi possível carregar seus produtos.'));
      }
    });
  }

  carregarPedidos(): void {
    this.pedidosService.listarDoProdutor().subscribe({
      next: resposta => this.pedidosRecebidos.set(resposta.data),
      error: erro => this.erroPedido.set(mensagemErro(erro, 'Não foi possível carregar os pedidos.'))
    });
  }

  novoProduto(): void {
    this.produtoEditandoId = null;
    this.formulario = this.formularioVazio();
    this.mensagem.set('');
    this.erro.set('');
    this.formularioAberto.set(true);
  }

  editarProduto(produto: Produto): void {
    this.produtoEditandoId = produto.id;

    this.formulario = {
      nome: produto.nome,
      descricao: produto.descricao,
      categoria: produto.categoria,
      material: produto.material,
      cor: produto.cor,
      preco: produto.preco,
      estoque: produto.estoque,
      prazoProducao: produto.prazoProducao,
      imagem: produto.imagem
    };

    this.mensagem.set('');
    this.erro.set('');
    this.formularioAberto.set(true);
  }

  cancelar(): void {
    this.formularioAberto.set(false);
    this.produtoEditandoId = null;
  }

  salvar(): void {
    const dados: DadosProduto = {
      ...this.formulario,
      nome: this.formulario.nome.trim(),
      descricao: this.formulario.descricao.trim(),
      material: this.formulario.material.trim(),
      imagem: this.formulario.imagem.trim(),
      cor: this.formulario.cor?.trim() || null,
      preco: Number(this.formulario.preco),
      estoque: Number(this.formulario.estoque),
      prazoProducao: Number(this.formulario.prazoProducao)
    };

    // RN01: preço, prazo, material e imagem obrigatórios (a API confere de novo).
    if (
      !dados.nome ||
      !dados.descricao ||
      !dados.imagem ||
      !dados.material ||
      !dados.categoria ||
      !Number.isFinite(dados.preco) ||
      dados.preco <= 0 ||
      !Number.isInteger(dados.estoque) ||
      dados.estoque < 0 ||
      !Number.isInteger(dados.prazoProducao) ||
      dados.prazoProducao < 1
    ) {
      this.erro.set('Preencha os campos corretamente.');
      return;
    }

    const editando = this.produtoEditandoId !== null;
    const requisicao = editando
      ? this.produtosService.editar(this.produtoEditandoId!, dados)
      : this.produtosService.cadastrar(dados);

    this.salvando.set(true);
    this.erro.set('');

    requisicao.subscribe({
      next: () => {
        this.salvando.set(false);
        this.mensagem.set(editando ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!');
        this.produtoEditandoId = null;
        this.formularioAberto.set(false);
        this.carregarProdutos();
      },
      error: erro => {
        this.salvando.set(false);
        this.erro.set(mensagemErro(erro, 'Não foi possível salvar o produto.'));
      }
    });
  }

  excluirProduto(produto: Produto): void {
    const confirmou = confirm(
      `Deseja realmente excluir "${produto.nome}"? Ele sai do catálogo, mas os pedidos antigos continuam.`
    );

    if (!confirmou) {
      return;
    }

    this.produtosService.excluir(produto.id).subscribe({
      next: () => {
        this.mensagem.set('Produto excluído do catálogo.');
        this.carregarProdutos();
      },
      error: erro => this.erro.set(mensagemErro(erro))
    });
  }

  reativarProduto(produto: Produto): void {
    this.produtosService.editar(produto.id, { ativo: true }).subscribe({
      next: () => {
        this.mensagem.set(`"${produto.nome}" voltou ao catálogo.`);
        this.carregarProdutos();
      },
      error: erro => this.erro.set(mensagemErro(erro))
    });
  }

  nomeStatusPedido(status: StatusPedido): string {
    return NOMES_STATUS_PEDIDO[status];
  }

  aceitar(pedido: Pedido): void {
    this.executarPedido(pedido, this.pedidosService.aceitar(pedido.id), 'Pedido aceito e incluído no lote.');
  }

  rejeitar(pedido: Pedido): void {
    const motivo = prompt('Motivo da recusa (opcional):');

    // null = clicou em Cancelar na janela.
    if (motivo === null) {
      return;
    }

    this.executarPedido(pedido, this.pedidosService.rejeitar(pedido.id, motivo), 'Pedido recusado. O estoque foi devolvido.');
  }

  avancar(pedido: Pedido, status: 'EM_PRODUCAO' | 'PRONTO_PARA_ENTREGA'): void {
    const texto = status === 'EM_PRODUCAO'
      ? 'Produção iniciada.'
      : 'Produção finalizada. Encaminhe o pedido ao ponto de retirada.';

    this.executarPedido(pedido, this.pedidosService.atualizarStatus(pedido.id, status), texto);
  }

  private executarPedido(pedido: Pedido, acao: Observable<Pedido>, sucesso: string): void {
    this.processandoPedidoId.set(pedido.id);
    this.mensagemPedido.set('');
    this.erroPedido.set('');

    acao.subscribe({
      next: () => {
        this.processandoPedidoId.set(null);
        this.mensagemPedido.set(`Pedido #${pedido.id}: ${sucesso}`);
        // Recarrega: o aceite pode ter fechado o lote e mudado a taxa de outros pedidos.
        this.carregarPedidos();
        this.carregarProdutos();
      },
      error: erro => {
        this.processandoPedidoId.set(null);
        this.erroPedido.set(mensagemErro(erro));
        this.carregarPedidos();
      }
    });
  }
}
