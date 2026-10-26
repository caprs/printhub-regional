// Formato das listas paginadas da API.
export interface Paginado<T> {
  data: T[];
  meta: {
    pagina: number;
    porPagina: number;
    total: number;
    totalPaginas: number;
  };
}
