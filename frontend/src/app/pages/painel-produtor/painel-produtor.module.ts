import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { PainelProdutor } from './painel-produtor';

@NgModule({
  declarations: [PainelProdutor],
  imports: [SharedModule, RouterModule.forChild([{ path: '', component: PainelProdutor }])],
})
export class PainelProdutorModule {}
