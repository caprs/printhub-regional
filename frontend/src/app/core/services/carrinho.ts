
import { Injectable, signal, computed } from '@angular/core';
import { Produto } from '../models/produto.model';
import { ItemCarrinho } from '../models/item-carrinho.model';

@Injectable({
  providedIn: 'root'
})
export class Carrinho {
  private readonly chaveStorage = 'printhub-carrinho';

  private readonly itensSignal = signal<ItemCarrinho[]>(
    this.carregarCarrinho()
  );

  readonly itens = this.itensSignal.asReadonly();

  readonly quantidadeTotal = computed(() =>
    this.itens().reduce(
      (total, item) => total + item.quantidade,
      0
    )
  );

  readonly subtotal = computed(() =>
    this.itens().reduce(
      (total, item) =>
        total + item.produto.preco * item.quantidade,
      0
    )
  );

  adicionar(produto: Produto, quantidade: number = 1): string | null {
    const itensAtuais = this.itens();

    if (!Number.isInteger(quantidade) || quantidade < 1) {
      return 'Informe uma quantidade válida.';
    }

    if (produto.estoque < 1) {
      return 'Este produto está indisponível.';
    }

    const produtorDiferente = itensAtuais.some(
      item => item.produto.produtorId !== produto.produtorId
    );

    if (produtorDiferente) {
      return 'Você só pode adicionar produtos do mesmo produtor ao carrinho.';
    }

    const itemExistente = itensAtuais.find(
      item => item.produto.id === produto.id
    );

    const quantidadeAtual = itemExistente?.quantidade ?? 0;

    if (quantidadeAtual + quantidade > produto.estoque) {
      return 'A quantidade solicitada ultrapassa o estoque disponível.';
    }

    let novosItens: ItemCarrinho[];

    if (itemExistente) {
      novosItens = itensAtuais.map(item =>
        item.produto.id === produto.id
          ? { ...item, quantidade: item.quantidade + quantidade }
          : item
      );
    } else {
      novosItens = [...itensAtuais, { produto, quantidade }];
    }

    this.atualizar(novosItens);

    return null;
  }

  aumentar(produtoId: number): string | null {
    const item = this.itens().find(
      item => item.produto.id === produtoId
    );

    if (!item) {
      return 'Produto não encontrado no carrinho.';
    }

    return this.adicionar(item.produto, 1);
  }

  diminuir(produtoId: number): void {
    const novosItens = this.itens()
      .map(item =>
        item.produto.id === produtoId
          ? { ...item, quantidade: item.quantidade - 1 }
          : item
      )
      .filter(item => item.quantidade > 0);

    this.atualizar(novosItens);
  }

  remover(produtoId: number): void {
    this.atualizar(
      this.itens().filter(
        item => item.produto.id !== produtoId
      )
    );
  }

  limpar(): void {
    this.atualizar([]);
  }

  private atualizar(itens: ItemCarrinho[]): void {
    this.itensSignal.set(itens);

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(
        this.chaveStorage,
        JSON.stringify(itens)
      );
    }
  }

  private carregarCarrinho(): ItemCarrinho[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }

    try {
      const dados = localStorage.getItem(this.chaveStorage);

      if (!dados) {
        return [];
      }

      const itens = JSON.parse(dados) as ItemCarrinho[];

      if (!Array.isArray(itens)) {
        return [];
      }

      // Validação básica dos dados salvos no navegador.
      const validos = itens.filter(item =>
        item?.produto &&
        Number.isInteger(item.produto.id) &&
        Number.isInteger(item.produto.produtorId) &&
        Number.isInteger(item.quantidade) &&
        item.quantidade > 0 &&
        item.quantidade <= item.produto.estoque
      );

      if (
        validos.length > 0 &&
        validos.some(
          item =>
            item.produto.produtorId !== validos[0].produto.produtorId
        )
      ) {
        return [];
      }

      return validos;
    } catch {
      return [];
    }
  }
}
