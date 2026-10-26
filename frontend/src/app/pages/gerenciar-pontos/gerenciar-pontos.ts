
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { PontosRetirada } from '../../core/services/pontos-retirada';
import { Administracao } from '../../core/services/administracao';
import { DadosPonto, PontoRetirada } from '../../core/models/ponto-retirada.model';
import { UsuarioAdmin } from '../../core/models/usuario.model';
import { mensagemErro } from '../../core/http/erro-api';

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
    MatSelectModule,
    MatSlideToggleModule
  ],
  templateUrl: './gerenciar-pontos.html',
  styleUrl: './gerenciar-pontos.scss'
})
export class GerenciarPontos {
  private pontosService = inject(PontosRetirada);
  private administracao = inject(Administracao);

  readonly pontos = signal<PontoRetirada[]>([]);
  readonly atendentes = signal<UsuarioAdmin[]>([]);
  readonly carregando = signal(true);
  readonly salvando = signal(false);
  readonly mensagem = signal('');
  readonly erro = signal('');

  formularioAberto = false;
  pontoEditandoId: number | null = null;

  formulario = this.formularioVazio();

  constructor() {
    this.carregar();

    this.administracao.listarUsuarios({ perfil: 'ATENDENTE', ativo: true }).subscribe({
      next: resposta => this.atendentes.set(resposta.data)
    });
  }

  private formularioVazio(): DadosPonto {
    return {
      nome: '',
      endereco: '',
      bairro: '',
      cidade: '',
      custoEntrega: 0,
      atendenteId: null,
      ativo: true
    };
  }

  carregar(): void {
    this.pontosService.listar(true).subscribe({
      next: pontos => {
        this.pontos.set(pontos);
        this.carregando.set(false);
      },
      error: erro => {
        this.carregando.set(false);
        this.erro.set(mensagemErro(erro, 'Não foi possível carregar os pontos.'));
      }
    });
  }

  // Atendentes livres, mais o que já cuida do ponto em edição.
  atendentesDisponiveis(): UsuarioAdmin[] {
    return this.atendentes().filter(
      atendente => atendente.pontoRetiradaId === null || atendente.pontoRetiradaId === this.pontoEditandoId
    );
  }

  novoPonto(): void {
    this.formulario = this.formularioVazio();
    this.pontoEditandoId = null;
    this.mensagem.set('');
    this.erro.set('');
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
      atendenteId: ponto.atendenteId,
      ativo: ponto.ativo
    };

    this.mensagem.set('');
    this.erro.set('');
    this.formularioAberto = true;
  }

  cancelar(): void {
    this.formularioAberto = false;
    this.pontoEditandoId = null;
  }

  salvar(): void {
    const dados: DadosPonto = { ...this.formulario, custoEntrega: Number(this.formulario.custoEntrega) };

    if (
      !dados.nome.trim() ||
      !dados.endereco.trim() ||
      !dados.bairro.trim() ||
      !dados.cidade.trim() ||
      !Number.isFinite(dados.custoEntrega) ||
      dados.custoEntrega <= 0
    ) {
      this.erro.set('Preencha os campos corretamente. O custo de entrega deve ser maior que zero.');
      return;
    }

    const editando = this.pontoEditandoId !== null;
    // No cadastro, o ponto nasce ativo; "ativo" só é enviado na edição.
    const { ativo, ...semAtivo } = dados;
    const requisicao = editando
      ? this.pontosService.editar(this.pontoEditandoId!, dados)
      : this.pontosService.cadastrar(semAtivo);

    this.salvando.set(true);
    this.erro.set('');

    requisicao.subscribe({
      next: () => {
        this.salvando.set(false);
        this.mensagem.set(editando ? 'Ponto atualizado com sucesso!' : 'Ponto cadastrado com sucesso!');
        this.formularioAberto = false;
        this.pontoEditandoId = null;
        this.carregar();
        this.administracao.listarUsuarios({ perfil: 'ATENDENTE', ativo: true }).subscribe({
          next: resposta => this.atendentes.set(resposta.data)
        });
      },
      error: erro => {
        this.salvando.set(false);
        this.erro.set(mensagemErro(erro, 'Não foi possível salvar o ponto.'));
      }
    });
  }

  alternarStatus(ponto: PontoRetirada): void {
    this.pontosService.editar(ponto.id, { ativo: !ponto.ativo }).subscribe({
      next: () => {
        this.mensagem.set(ponto.ativo ? 'Ponto desativado com sucesso!' : 'Ponto ativado com sucesso!');
        this.carregar();
      },
      error: erro => this.erro.set(mensagemErro(erro))
    });
  }
}
