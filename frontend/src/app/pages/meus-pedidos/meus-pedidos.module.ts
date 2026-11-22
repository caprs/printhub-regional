import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { MeusPedidos } from './meus-pedidos';

@NgModule({
  declarations: [MeusPedidos],
  imports: [SharedModule, RouterModule.forChild([{ path: '', component: MeusPedidos }])],
})
export class MeusPedidosModule {}
