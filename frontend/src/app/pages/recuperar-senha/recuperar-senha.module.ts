import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { RecuperarSenha } from './recuperar-senha';

@NgModule({
  declarations: [RecuperarSenha],
  imports: [SharedModule, RouterModule.forChild([{ path: '', component: RecuperarSenha }])],
})
export class RecuperarSenhaModule {}
