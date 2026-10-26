import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { Perfil } from '../models/usuario.model';
import { Auth } from '../services/auth';

// Protege a rota: exige login e, se informado, um dos perfis.
// A API valida de novo; isto só evita abrir telas que dariam erro.
export function exigirPerfil(...perfis: Perfil[]): CanActivateFn {
  return (_rota, estado) => {
    const auth = inject(Auth);
    const router = inject(Router);

    if (!auth.logado()) {
      return router.createUrlTree(['/login'], { queryParams: { voltar: estado.url } });
    }

    if (perfis.length > 0 && !auth.temPerfil(...perfis)) {
      return router.createUrlTree([auth.rotaInicial()]);
    }

    return true;
  };
}
