import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { Administracao } from './administracao';

@NgModule({
  declarations: [Administracao],
  imports: [SharedModule, RouterModule.forChild([{ path: '', component: Administracao }])],
})
export class AdministracaoModule {}
