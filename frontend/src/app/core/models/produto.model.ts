export interface Produto {
  id: number;
  produtorId: number;
  nome: string;
  descricao: string;
  categoria: string;
  material: string;
  cor: string | null;
  preco: number;
  produtor: string;
  imagem: string;
  estoque: number;
  prazoProducao: number;
  ativo: boolean;
  notaMedia: number | null;
  totalAvaliacoes: number;
}

// Campos enviados ao cadastrar ou editar (o produtor vem do login).
export interface DadosProduto {
  nome: string;
  descricao: string;
  categoria: string;
  material: string;
  cor: string | null;
  preco: number;
  imagem: string;
  estoque: number;
  prazoProducao: number;
}

export interface FiltrosProduto {
  busca?: string;
  categoria?: string;
  material?: string;
  precoMin?: number;
  precoMax?: number;
  ordenar?: 'recentes' | 'preco_asc' | 'preco_desc';
  pagina?: number;
  porPagina?: number;
}
