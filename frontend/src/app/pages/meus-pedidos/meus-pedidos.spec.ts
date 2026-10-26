import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeusPedidos } from './meus-pedidos';

describe('MeusPedidos', () => {
  let component: MeusPedidos;
  let fixture: ComponentFixture<MeusPedidos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MeusPedidos],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MeusPedidos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
