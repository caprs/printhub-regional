import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';

const MODULES = [
  CommonModule, FormsModule, ReactiveFormsModule, RouterModule,
  MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule,
  MatInputModule, MatMenuModule, MatRadioModule, MatSelectModule,
  MatSlideToggleModule, MatTabsModule,
];

@NgModule({ imports: MODULES, exports: MODULES })
export class SharedModule {}
