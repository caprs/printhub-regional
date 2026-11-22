import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { Catalogo } from './catalogo';

@NgModule({
  declarations: [Catalogo],
  imports: [SharedModule, RouterModule.forChild([{ path: '', component: Catalogo }])],
})
export class CatalogoModule {}
