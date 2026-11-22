import { provideHttpClient } from '@angular/common/http';
import { SharedModule } from '../../shared/shared.module';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetalhesProduto } from './detalhes-produto';

describe('DetalhesProduto', () => {
  let component: DetalhesProduto;
  let fixture: ComponentFixture<DetalhesProduto>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DetalhesProduto],
      imports: [SharedModule],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(DetalhesProduto);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
