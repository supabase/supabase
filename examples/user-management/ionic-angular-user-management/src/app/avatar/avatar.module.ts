import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AvatarComponent } from './avatar.component';

@NgModule({
  imports: [ CommonModule, FormsModule, IonicModule,],
  declarations: [AvatarComponent],
  exports: [AvatarComponent]
})
export class AvatarComponentModule {}
