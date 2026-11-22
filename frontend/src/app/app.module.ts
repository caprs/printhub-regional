import { DEFAULT_CURRENCY_CODE, LOCALE_ID, NgModule } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { SharedModule } from './shared/shared.module';
import { authInterceptor } from './core/http/auth.interceptor';
import { App } from './app';
import { Header } from './layout/header/header';

registerLocaleData(localePt);

@NgModule({
  declarations: [App, Header],
  imports: [BrowserModule, SharedModule, AppRoutingModule],
  bootstrap: [App],
  providers: [
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    { provide: DEFAULT_CURRENCY_CODE, useValue: 'BRL' },
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
  ],
})
export class AppModule {}
