import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { Auth } from '../../core/services/auth';
import { Carrinho } from '../../core/services/carrinho';
import { Perfil } from '../../core/models/usuario.model';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, MatButtonModule, MatIconModule],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header implements OnInit {
  readonly auth = inject(Auth);
  readonly carrinho = inject(Carrinho);

  ngOnInit(): void {
    // Confere o token salvo assim que o site abre.
    this.auth.atualizarUsuario();
  }

  nomePerfil(perfil: Perfil): string {
    const nomes: Record<Perfil, string> = {
      CONSUMIDOR: 'Consumidor',
      PRODUTOR: 'Produtor',
      ATENDENTE: 'Atendente',
      ADMINISTRADOR: 'Administrador'
    };

    return nomes[perfil];
  }

  // Quem pode comprar vê o carrinho.
  podeComprar(): boolean {
    return !this.auth.logado() || this.auth.temPerfil('CONSUMIDOR', 'PRODUTOR');
  }
}
