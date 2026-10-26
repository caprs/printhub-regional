import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';

import { Pedidos } from './pedidos';

describe('Pedidos', () => {
  let service: Pedidos;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    service = TestBed.inject(Pedidos);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
