
import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { PontosRetirada } from '../../core/services/pontos-retirada';
import { PontoRetirada } from '../../core/models/ponto-retirada.model';

@Component({
  selector: 'app-gerenciar-pontos',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatSlideToggleModule
  ],
  templateUrl: './gerenciar-pontos.html',
  styleUrl: './gerenciar-pontos.scss'
})
export class GerenciarPontos {
  private pontosService = inject(PontosRetirada);

  readonly pontos = computed(() =>
    this.pontosService.listaPontos()
  );

  formularioAberto = false;
  pontoEditandoId: number | null = null;
  mensagem = '';

  formulario = this.formularioVazio();

  private formularioVazio() {
    return {
      nome: '',
      endereco: '',
      bairro: '',
      cidade: '',
      custoEntrega: 0,
      ativo: true
    };
  }

  novoPonto(): void {
    this.formulario = this.formularioVazio();
    this.pontoEditandoId = null;
    this.mensagem = '';
    this.formularioAberto = true;
  }

  editarPonto(ponto: PontoRetirada): void {
    this.pontoEditandoId = ponto.id;

    this.formulario = {
      nome: ponto.nome,
      endereco: ponto.endereco,
      bairro: ponto.bairro,
      cidade: ponto.cidade,
      custoEntrega: ponto.custoEntrega,
      ativo: ponto.ativo
    };

    this.mensagem = '';
    this.formularioAberto = true;
  }

  cancelar(): void {
    this.formularioAberto = false;
    this.pontoEditandoId = null;
  }

  salvar(): void {
    const dados = this.formulario;

    if (
      !dados.nome.trim() ||
      !dados.endereco.trim() ||
      !dados.bairro.trim() ||
      !dados.cidade.trim() ||
      !Number.isFinite(dados.custoEntrega) ||
      dados.custoEntrega < 0
    ) {
      this.mensagem = 'Preencha os campos corretamente.';
      return;
    }

    if (this.pontoEditandoId !== null) {
      this.pontosService.editar(this.pontoEditandoId, dados);
      this.mensagem = 'Ponto atualizado com sucesso!';
    } else {
      this.pontosService.cadastrar(dados);
      this.mensagem = 'Ponto cadastrado com sucesso!';
    }

    this.formularioAberto = false;
    this.pontoEditandoId = null;
  }

  alternarStatus(ponto: PontoRetirada): void {
    this.pontosService.alternarStatus(ponto.id);

    this.mensagem = ponto.ativo
      ? 'Ponto desativado com sucesso!'
      : 'Ponto ativado com sucesso!';
  }
}
