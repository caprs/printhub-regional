import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';

import { Auth } from '../../core/services/auth';
import { Administracao as AdministracaoService, NovoUsuario } from '../../core/services/administracao';
import { Perfil, UsuarioAdmin } from '../../core/models/usuario.model';
import { RegistroAuditoria } from '../../core/models/dashboard.model';
import { mensagemErro } from '../../core/http/erro-api';

@Component({
  standalone: false,
  selector: 'app-administracao',
  templateUrl: './administracao.html',
  styleUrl: './administracao.scss'
})
export class Administracao {
  private service = inject(AdministracaoService);
  readonly auth = inject(Auth);

  readonly perfis: { valor: Perfil; nome: string }[] = [
    { valor: 'CONSUMIDOR', nome: 'Consumidor' },
    { valor: 'PRODUTOR', nome: 'Produtor' },
    { valor: 'ATENDENTE', nome: 'Atendente' },
    { valor: 'ADMINISTRADOR', nome: 'Administrador' }
  ];

  readonly usuarios = signal<UsuarioAdmin[]>([]);
  readonly registros = signal<RegistroAuditoria[]>([]);
  readonly paginaRegistros = signal(1);
  readonly totalPaginasRegistros = signal(1);
  readonly mensagem = signal('');
  readonly erro = signal('');
  readonly salvando = signal(false);

  filtroPerfil: Perfil | '' = '';
  busca = '';
  filtroAcao = '';

  formularioAberto = false;
  novo: NovoUsuario = this.usuarioVazio();

  constructor() {
    this.carregarUsuarios();
    this.carregarRegistros();
  }

  nomePerfil(perfil: Perfil): string {
    return this.perfis.find(p => p.valor === perfil)?.nome ?? perfil;
  }

  carregarUsuarios(): void {
    this.service
      .listarUsuarios({ perfil: this.filtroPerfil || undefined, busca: this.busca.trim() || undefined })
      .subscribe({
        next: resposta => this.usuarios.set(resposta.data),
        error: erro => this.erro.set(mensagemErro(erro, 'Não foi possível carregar os usuários.'))
      });
  }

  carregarRegistros(pagina = 1): void {
    this.service.listarRegistros({ acao: this.filtroAcao.trim().toUpperCase() || undefined, pagina }).subscribe({
      next: resposta => {
        this.registros.set(resposta.data);
        this.paginaRegistros.set(resposta.meta.pagina);
        this.totalPaginasRegistros.set(Math.max(resposta.meta.totalPaginas, 1));
      },
      error: erro => this.erro.set(mensagemErro(erro, 'Não foi possível carregar os registros.'))
    });
  }

  abrirFormulario(): void {
    this.novo = this.usuarioVazio();
    this.formularioAberto = true;
    this.mensagem.set('');
    this.erro.set('');
  }

  criarUsuario(): void {
    this.salvando.set(true);
    this.erro.set('');

    this.service.criarUsuario({ ...this.novo, email: this.novo.email.trim() }).subscribe({
      next: usuario => {
        this.salvando.set(false);
        this.formularioAberto = false;
        this.mensagem.set(`${this.nomePerfil(usuario.perfil)} "${usuario.nome}" criado. Informe a senha a ele.`);
        this.carregarUsuarios();
      },
      error: erro => {
        this.salvando.set(false);
        this.erro.set(mensagemErro(erro, 'Não foi possível criar o usuário.'));
      }
    });
  }

  alterarPerfil(usuario: UsuarioAdmin, perfil: Perfil): void {
    this.alterar(usuario, { perfil }, `Perfil de ${usuario.nome} alterado para ${this.nomePerfil(perfil)}.`);
  }

  alternarAtivo(usuario: UsuarioAdmin): void {
    const texto = usuario.ativo ? `${usuario.nome} foi desativado e perdeu o acesso.` : `${usuario.nome} foi reativado.`;
    this.alterar(usuario, { ativo: !usuario.ativo }, texto);
  }

  resumoDados(dados: unknown): string {
    if (!dados || typeof dados !== 'object') {
      return '';
    }

    return Object.entries(dados as Record<string, unknown>)
      .map(([chave, valor]) => `${chave}: ${typeof valor === 'object' ? JSON.stringify(valor) : valor}`)
      .join(' · ');
  }

  private alterar(usuario: UsuarioAdmin, dados: { perfil?: Perfil; ativo?: boolean }, sucesso: string): void {
    this.mensagem.set('');
    this.erro.set('');

    this.service.alterarUsuario(usuario.id, dados).subscribe({
      next: atualizado => {
        this.usuarios.update(lista => lista.map(u => (u.id === usuario.id ? atualizado : u)));
        this.mensagem.set(sucesso);
      },
      error: erro => {
        this.erro.set(mensagemErro(erro));
        // Volta o select para o valor real.
        this.carregarUsuarios();
      }
    });
  }

  private usuarioVazio(): NovoUsuario {
    return { nome: '', email: '', senha: '', perfil: 'ATENDENTE' };
  }
}
