import { provideHttpClient } from '@angular/common/http';
import { SharedModule } from '../../shared/shared.module';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PontoRetirada } from './ponto-retirada';

describe('PontoRetirada', () => {
  let component: PontoRetirada;
  let fixture: ComponentFixture<PontoRetirada>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PontoRetirada],
      imports: [SharedModule],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PontoRetirada);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
