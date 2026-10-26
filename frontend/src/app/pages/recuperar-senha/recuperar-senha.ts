import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

import { Auth } from '../../core/services/auth';
import { mensagemErro } from '../../core/http/erro-api';

@Component({
  selector: 'app-recuperar-senha',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './recuperar-senha.html',
  styleUrl: '../login/login.scss'
})
export class RecuperarSenha {
  private fb = inject(FormBuilder);
  private auth = inject(Auth);

  readonly etapa = signal<'email' | 'nova-senha' | 'concluido'>('email');
  readonly mensagem = signal('');
  readonly erro = signal('');
  readonly enviando = signal(false);
  // O envio de e-mail ainda não existe: em teste a API devolve o token.
  readonly tokenPreenchido = signal(false);

  formEmail = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  formSenha = this.fb.nonNullable.group({
    token: ['', Validators.required],
    novaSenha: ['', [Validators.required, Validators.minLength(8)]]
  });

  solicitar(): void {
    if (this.formEmail.invalid) {
      this.formEmail.markAllAsTouched();
      return;
    }

    this.erro.set('');
    this.enviando.set(true);

    this.auth.solicitarRecuperacao(this.formEmail.getRawValue().email).subscribe({
      next: resposta => {
        this.enviando.set(false);
        this.mensagem.set(resposta.mensagem);

        if (resposta.tokenRecuperacao) {
          this.formSenha.patchValue({ token: resposta.tokenRecuperacao });
          this.tokenPreenchido.set(true);
        }

        this.etapa.set('nova-senha');
      },
      error: erro => {
        this.enviando.set(false);
        this.erro.set(mensagemErro(erro));
      }
    });
  }

  redefinir(): void {
    if (this.formSenha.invalid) {
      this.formSenha.markAllAsTouched();
      return;
    }

    const { token, novaSenha } = this.formSenha.getRawValue();
    this.erro.set('');
    this.enviando.set(true);

    this.auth.redefinirSenha(token.trim(), novaSenha).subscribe({
      next: resposta => {
        this.enviando.set(false);
        this.mensagem.set(resposta.mensagem);
        this.etapa.set('concluido');
      },
      error: erro => {
        this.enviando.set(false);
        this.erro.set(mensagemErro(erro));
      }
    });
  }
}
