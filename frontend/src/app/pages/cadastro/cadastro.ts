
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

import { Auth } from '../../core/services/auth';
import { mensagemErro } from '../../core/http/erro-api';

@Component({
  standalone: false,
  selector: 'app-cadastro',
  templateUrl: './cadastro.html',
  styleUrl: './cadastro.scss'
})
export class Cadastro {
  private fb = inject(FormBuilder);
  private auth = inject(Auth);
  private router = inject(Router);

  ocultarSenha = true;
  ocultarConfirmacao = true;
  readonly mensagem = signal('');
  readonly enviando = signal(false);

  formulario = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    // Mesmo formato aceito pela API: dígitos, espaços, parênteses, + e -, com DDD.
    telefone: ['', [Validators.required, Validators.pattern(/^[\d\s()+-]{10,20}$/)]],
    tipoConta: ['CONSUMIDOR' as 'CONSUMIDOR' | 'PRODUTOR', Validators.required],
    senha: ['', [Validators.required, Validators.minLength(8)]],
    confirmarSenha: ['', Validators.required]
  });

  cadastrar(): void {
    this.mensagem.set('');

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const dados = this.formulario.getRawValue();

    if (dados.senha !== dados.confirmarSenha) {
      this.mensagem.set('As senhas não coincidem.');
      return;
    }

    this.enviando.set(true);

    this.auth
      .cadastrar({
        nome: dados.nome,
        email: dados.email,
        telefone: dados.telefone,
        senha: dados.senha,
        perfil: dados.tipoConta
      })
      .subscribe({
        next: () => {
          this.enviando.set(false);
          this.router.navigateByUrl(this.auth.rotaInicial());
        },
        error: erro => {
          this.enviando.set(false);
          this.mensagem.set(mensagemErro(erro, 'Não foi possível criar a conta.'));
        }
      });
  }
}
