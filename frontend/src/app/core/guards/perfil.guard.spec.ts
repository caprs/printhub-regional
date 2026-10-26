import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, RouterStateSnapshot, UrlTree } from '@angular/router';

import { Usuario } from '../models/usuario.model';
import { exigirPerfil } from './perfil.guard';

function executar(perfis: Parameters<typeof exigirPerfil>, url = '/painel-produtor') {
  return TestBed.runInInjectionContext(() =>
    exigirPerfil(...perfis)({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot)
  );
}

function entrarComo(usuario: Partial<Usuario>) {
  localStorage.setItem('printhub-token', 'token-de-teste');
  localStorage.setItem('printhub-usuario', JSON.stringify(usuario));
}

describe('exigirPerfil', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    });
  });

  afterEach(() => localStorage.clear());

  it('manda para o login guardando a página de volta', () => {
    const resultado = executar([], '/meus-pedidos') as UrlTree;

    expect(resultado.toString()).toBe('/login?voltar=%2Fmeus-pedidos');
  });

  it('libera o perfil certo', () => {
    entrarComo({ id: 1, nome: 'Ana', perfil: 'PRODUTOR' });

    expect(executar(['PRODUTOR'])).toBe(true);
  });

  it('manda o perfil errado para a sua página inicial', () => {
    entrarComo({ id: 2, nome: 'Bia', perfil: 'ATENDENTE' });

    expect((executar(['PRODUTOR']) as UrlTree).toString()).toBe('/ponto-retirada');
  });
});
