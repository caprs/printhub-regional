import { TestBed } from '@angular/core/testing';

import { PontosRetirada } from './pontos-retirada';

describe('PontosRetirada', () => {
  let service: PontosRetirada;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PontosRetirada);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
