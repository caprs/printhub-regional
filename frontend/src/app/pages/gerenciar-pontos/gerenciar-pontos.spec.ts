import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GerenciarPontos } from './gerenciar-pontos';

describe('GerenciarPontos', () => {
  let component: GerenciarPontos;
  let fixture: ComponentFixture<GerenciarPontos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GerenciarPontos],
    }).compileComponents();

    fixture = TestBed.createComponent(GerenciarPontos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
