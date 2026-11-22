import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { GerenciarPontos } from './gerenciar-pontos';

@NgModule({
  declarations: [GerenciarPontos],
  imports: [SharedModule, RouterModule.forChild([{ path: '', component: GerenciarPontos }])],
})
export class GerenciarPontosModule {}
