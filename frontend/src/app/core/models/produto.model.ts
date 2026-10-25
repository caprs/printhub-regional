export interface Produto {
  id: number;
  produtorId: number;
  nome: string;
  descricao: string;
  categoria: string;
  material: string;
  preco: number;
  produtor: string;
  imagem: string;
  estoque: number;
  prazoProducao: number;
}