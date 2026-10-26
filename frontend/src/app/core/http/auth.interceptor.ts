import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Auth } from '../services/auth';

// Envia o token em toda chamada à API e encerra a sessão se ele expirar.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  const token = auth.token;
  const ehApi = req.url.startsWith(environment.apiUrl);

  const requisicao = token && ehApi
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(requisicao).pipe(
    catchError(erro => {
      const tokenRecusado =
        erro instanceof HttpErrorResponse &&
        erro.status === 401 &&
        token &&
        ehApi &&
        !req.url.endsWith('/auth/login');

      if (tokenRecusado) {
        auth.encerrarSessaoExpirada();
      }

      return throwError(() => erro);
    })
  );
};
