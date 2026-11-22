import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { Carrinho } from './carrinho';

@NgModule({
  declarations: [Carrinho],
  imports: [SharedModule, RouterModule.forChild([{ path: '', component: Carrinho }])],
})
export class CarrinhoModule {}
