export interface PontoRetirada {
  id: number;
  nome: string;
  endereco: string;
  bairro: string;
  cidade: string;
  custoEntrega: number;
  ativo: boolean;
}