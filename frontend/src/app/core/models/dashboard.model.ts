import { StatusPedido } from './pedido.model';

export interface IndicadoresDashboard {
  pedidos: {
    total: number;
    emAndamento: number;
    aguardandoAceitacao: number;
    retirados: number;
    porStatus: Partial<Record<StatusPedido, number>>;
  };
  produtos: { ativos: number };
  pontosAtivos: number;
  lotes: { emFormacao: number; fechados: number; concluidos: number };
  maisVendidos: { produtoId: number; nome: string; quantidade: number }[];
}

export interface Avaliacao {
  id: number;
  nota: number;
  comentario: string | null;
  autor: string;
  produtoId: number;
  produto: string;
  pedidoId: number;
  data: string;
}

export interface RegistroAuditoria {
  id: number;
  acao: string;
  usuarioId: number | null;
  usuario: string;
  entidade: string;
  entidadeId: number | null;
  dados: unknown;
  data: string;
}
