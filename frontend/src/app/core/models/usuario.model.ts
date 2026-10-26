export type Perfil = 'CONSUMIDOR' | 'PRODUTOR' | 'ATENDENTE' | 'ADMINISTRADOR';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  perfil: Perfil;
  pontoRetiradaId?: number | null;
}

export interface Sessao {
  token: string;
  usuario: Usuario;
}

export interface UsuarioAdmin extends Usuario {
  ativo: boolean;
  criadoEm: string;
  pontoRetiradaId: number | null;
}
