
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { Auth } from '../../core/services/auth';
import { mensagemErro } from '../../core/http/erro-api';

@Component({
  selector: 'app-login',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  private fb = inject(FormBuilder);
  private auth = inject(Auth);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ocultarSenha = true;
  readonly mensagem = signal('');
  readonly enviando = signal(false);

  // Veio de uma sessão expirada ou de uma tela que exige login.
  readonly sessaoExpirada = this.route.snapshot.queryParamMap.has('expirada');
  private readonly voltarPara = this.route.snapshot.queryParamMap.get('voltar');

  formulario = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', Validators.required]
  });

  entrar(): void {
    this.mensagem.set('');

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const { email, senha } = this.formulario.getRawValue();
    this.enviando.set(true);

    this.auth.login(email, senha).subscribe({
      next: () => {
        this.enviando.set(false);
        this.router.navigateByUrl(this.voltarPara || this.auth.rotaInicial());
      },
      error: erro => {
        this.enviando.set(false);
        this.mensagem.set(mensagemErro(erro, 'Não foi possível entrar.'));
      }
    });
  }
}
