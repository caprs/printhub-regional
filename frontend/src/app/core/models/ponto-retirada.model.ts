export interface PontoRetirada {
  id: number;
  nome: string;
  endereco: string;
  bairro: string;
  cidade: string;
  custoEntrega: number;
  ativo: boolean;
  atendenteId: number | null;
  atendente: string | null;
  loteAberto: {
    id: number;
    codigo: string;
    quantidadePedidos: number;
    dataLimite: string;
  } | null;
  // Para o checkout: até quanto a taxa pode custar e quanto pode cair.
  taxaEstimada: {
    maxima: number;
    minima: number;
  };
}

export interface DadosPonto {
  nome: string;
  endereco: string;
  bairro: string;
  cidade: string;
  custoEntrega: number;
  atendenteId: number | null;
  ativo?: boolean;
}
