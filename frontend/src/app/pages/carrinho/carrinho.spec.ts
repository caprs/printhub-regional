import { provideHttpClient } from '@angular/common/http';
import { SharedModule } from '../../shared/shared.module';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Carrinho } from './carrinho';

describe('Carrinho', () => {
  let component: Carrinho;
  let fixture: ComponentFixture<Carrinho>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Carrinho],
      imports: [SharedModule],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Carrinho);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
