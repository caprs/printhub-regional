export type StatusLote =
  | 'EM_FORMACAO'
  | 'FECHADO'
  | 'AGUARDANDO_PRODUCAO'
  | 'PRONTO_PARA_ENTREGA'
  | 'CONCLUIDO';

export interface Lote {
  id: number;
  codigo: string;
  pontoRetiradaId: number;
  pontoRetirada: string;
  dataAbertura: string;
  dataLimite: string;
  dataFechamento: string | null;
  quantidadePedidos: number;
  capacidade: number;
  custoEntrega: number;
  // Antes de fechar: estimativa atual. Depois: valor de referência.
  taxaPorPedido: number | null;
  taxaDefinitiva: boolean;
  status: StatusLote;
}

export const NOMES_STATUS_LOTE: Record<StatusLote, string> = {
  EM_FORMACAO: 'Em formação',
  FECHADO: 'Fechado',
  AGUARDANDO_PRODUCAO: 'Aguardando produção',
  PRONTO_PARA_ENTREGA: 'Pronto para entrega',
  CONCLUIDO: 'Concluído'
};
