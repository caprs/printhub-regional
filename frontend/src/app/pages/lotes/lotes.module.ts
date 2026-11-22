import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { LotesPage } from './lotes';

@NgModule({
  declarations: [LotesPage],
  imports: [SharedModule, RouterModule.forChild([{ path: '', component: LotesPage }])],
})
export class LotesModule {}
