import { TestBed } from '@angular/core/testing';

import { PedidosProdutor } from './pedidos-produtor';

describe('PedidosProdutor', () => {
  let service: PedidosProdutor;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PedidosProdutor);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
