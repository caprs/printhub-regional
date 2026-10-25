import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PontoRetirada } from './ponto-retirada';

describe('PontoRetirada', () => {
  let component: PontoRetirada;
  let fixture: ComponentFixture<PontoRetirada>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PontoRetirada],
    }).compileComponents();

    fixture = TestBed.createComponent(PontoRetirada);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
