import { RenderMode, ServerRoute } from '@angular/ssr';

// As telas dependem do login (guardado no navegador) e de dados da API,
// então são renderizadas no navegador. Pré-renderizar no build chamaria a API
// sem usuário e geraria páginas com dados velhos.
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Client
  }
];
