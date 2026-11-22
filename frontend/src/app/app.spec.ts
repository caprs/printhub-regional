import { provideHttpClient } from '@angular/common/http';
import { SharedModule } from './shared/shared.module';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { Header } from './layout/header/header';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [App, Header],
      imports: [SharedModule],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('mostra o cabeçalho do PrintHub', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.logo')?.textContent).toContain('PrintHub');
  });
});
