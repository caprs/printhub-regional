import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { Checkout } from './checkout';

@NgModule({
  declarations: [Checkout],
  imports: [SharedModule, RouterModule.forChild([{ path: '', component: Checkout }])],
})
export class CheckoutModule {}
