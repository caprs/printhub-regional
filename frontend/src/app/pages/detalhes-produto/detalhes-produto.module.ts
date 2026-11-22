import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { DetalhesProduto } from './detalhes-produto';

@NgModule({
  declarations: [DetalhesProduto],
  imports: [SharedModule, RouterModule.forChild([{ path: '', component: DetalhesProduto }])],
})
export class DetalhesProdutoModule {}
