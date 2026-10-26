import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';

import { Lotes } from './lotes';

describe('Lotes', () => {
  let service: Lotes;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    service = TestBed.inject(Lotes);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
