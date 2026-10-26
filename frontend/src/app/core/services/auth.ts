import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Perfil, Sessao, Usuario } from '../models/usuario.model';

export interface DadosCadastro {
  nome: string;
  email: string;
  telefone: string;
  senha: string;
  perfil: 'CONSUMIDOR' | 'PRODUTOR';
}

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly url = `${environment.apiUrl}/auth`;
  private readonly chaveToken = 'printhub-token';
  private readonly chaveUsuario = 'printhub-usuario';

  private readonly usuarioSignal = signal<Usuario | null>(this.lerUsuarioSalvo());

  readonly usuario = this.usuarioSignal.asReadonly();
  readonly logado = computed(() => this.usuario() !== null);
  readonly perfil = computed(() => this.usuario()?.perfil ?? null);

  get token(): string | null {
    return isPlatformBrowser(this.platformId)
      ? localStorage.getItem(this.chaveToken)
      : null;
  }

  temPerfil(...perfis: Perfil[]): boolean {
    const perfil = this.perfil();
    return perfil !== null && perfis.includes(perfil);
  }

  login(email: string, senha: string): Observable<Usuario> {
    return this.http
      .post<Sessao>(`${this.url}/login`, { email, senha })
      .pipe(tap(sessao => this.salvarSessao(sessao)), map(sessao => sessao.usuario));
  }

  cadastrar(dados: DadosCadastro): Observable<Usuario> {
    return this.http
      .post<Sessao>(`${this.url}/register`, dados)
      .pipe(tap(sessao => this.salvarSessao(sessao)), map(sessao => sessao.usuario));
  }

  // Confere o token salvo e atualiza perfil/nome (o admin pode ter alterado).
  atualizarUsuario(): void {
    if (!this.token) {
      return;
    }

    this.http.get<Usuario>(`${this.url}/me`).subscribe({
      next: usuario => this.guardarUsuario(usuario)
    });
  }

  solicitarRecuperacao(email: string): Observable<{ mensagem: string; tokenRecuperacao?: string }> {
    return this.http.post<{ mensagem: string; tokenRecuperacao?: string }>(
      `${this.url}/forgot-password`,
      { email }
    );
  }

  redefinirSenha(token: string, novaSenha: string): Observable<{ mensagem: string }> {
    return this.http.post<{ mensagem: string }>(`${this.url}/reset-password`, { token, novaSenha });
  }

  sair(): void {
    this.limparSessao();
    this.router.navigate(['/login']);
  }

  // Chamado pelo interceptor quando a API responde 401 com um token salvo.
  encerrarSessaoExpirada(): void {
    if (!this.logado()) {
      return;
    }

    this.limparSessao();
    this.router.navigate(['/login'], {
      queryParams: { expirada: 1, voltar: this.router.url }
    });
  }

  // Página inicial de cada perfil depois do login.
  rotaInicial(): string {
    switch (this.perfil()) {
      case 'PRODUTOR':
        return '/painel-produtor';
      case 'ATENDENTE':
        return '/ponto-retirada';
      case 'ADMINISTRADOR':
        return '/dashboard';
      default:
        return '/';
    }
  }

  private salvarSessao(sessao: Sessao): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.chaveToken, sessao.token);
    }

    this.guardarUsuario(sessao.usuario);
  }

  private guardarUsuario(usuario: Usuario): void {
    this.usuarioSignal.set(usuario);

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.chaveUsuario, JSON.stringify(usuario));
    }
  }

  private limparSessao(): void {
    this.usuarioSignal.set(null);

    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.chaveToken);
      localStorage.removeItem(this.chaveUsuario);
    }
  }

  private lerUsuarioSalvo(): Usuario | null {
    if (!isPlatformBrowser(this.platformId) || !localStorage.getItem(this.chaveToken)) {
      return null;
    }

    try {
      return JSON.parse(localStorage.getItem(this.chaveUsuario) ?? 'null') as Usuario | null;
    } catch {
      return null;
    }
  }
}
