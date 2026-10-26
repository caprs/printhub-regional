import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';

import { Produtos } from './produtos';

describe('Produtos', () => {
  let service: Produtos;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    service = TestBed.inject(Produtos);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
