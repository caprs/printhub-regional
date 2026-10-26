import { HttpParams } from '@angular/common/http';

// Monta a query string ignorando filtros vazios.
export function parametros(filtros: object = {}): HttpParams {
  let params = new HttpParams();

  for (const [chave, valor] of Object.entries(filtros)) {
    if (valor !== undefined && valor !== null && valor !== '') {
      params = params.set(chave, String(valor));
    }
  }

  return params;
}
