import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { PontoRetirada } from './ponto-retirada';

@NgModule({
  declarations: [PontoRetirada],
  imports: [SharedModule, RouterModule.forChild([{ path: '', component: PontoRetirada }])],
})
export class PontoRetiradaModule {}
