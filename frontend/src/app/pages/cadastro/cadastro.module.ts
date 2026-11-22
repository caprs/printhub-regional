import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { Cadastro } from './cadastro';

@NgModule({
  declarations: [Cadastro],
  imports: [SharedModule, RouterModule.forChild([{ path: '', component: Cadastro }])],
})
export class CadastroModule {}
