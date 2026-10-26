import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Paginado } from '../models/api.model';
import { IndicadoresDashboard, RegistroAuditoria } from '../models/dashboard.model';
import { Perfil, UsuarioAdmin } from '../models/usuario.model';
import { parametros } from '../http/parametros';

export interface NovoUsuario {
  nome: string;
  email: string;
  senha: string;
  perfil: Perfil;
}

@Injectable({
  providedIn: 'root'
})
export class Administracao {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  // Administrador vê tudo; produtor vê só os próprios números.
  dashboard(): Observable<IndicadoresDashboard> {
    return this.http.get<IndicadoresDashboard>(`${this.api}/dashboard`);
  }

  listarUsuarios(filtros: { perfil?: Perfil; busca?: string; ativo?: boolean } = {}): Observable<Paginado<UsuarioAdmin>> {
    return this.http.get<Paginado<UsuarioAdmin>>(`${this.api}/admin/users`, {
      params: parametros({ porPagina: 50, ...filtros })
    });
  }

  criarUsuario(dados: NovoUsuario): Observable<UsuarioAdmin> {
    return this.http.post<UsuarioAdmin>(`${this.api}/admin/users`, dados);
  }

  alterarUsuario(id: number, dados: { nome?: string; perfil?: Perfil; ativo?: boolean }): Observable<UsuarioAdmin> {
    return this.http.patch<UsuarioAdmin>(`${this.api}/admin/users/${id}`, dados);
  }

  listarRegistros(filtros: { acao?: string; entidade?: string; pagina?: number } = {}): Observable<Paginado<RegistroAuditoria>> {
    return this.http.get<Paginado<RegistroAuditoria>>(`${this.api}/admin/audit-logs`, {
      params: parametros({ porPagina: 30, ...filtros })
    });
  }
}
