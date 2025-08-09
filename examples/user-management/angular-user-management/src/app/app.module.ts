import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app';
import { AuthComponent } from './auth/auth';
import { AccountComponent } from './account/account';
import { ReactiveFormsModule } from '@angular/forms';
import { AvatarComponent } from './avatar/avatar';

@NgModule({
  declarations: [
    AppComponent,
    AuthComponent,
    AccountComponent,
    AvatarComponent,
  ],
  imports: [BrowserModule, ReactiveFormsModule],
  providers: [],
  bootstrap: [AppComponent],
  exports: [AppComponent, AuthComponent, AccountComponent, AvatarComponent],
})
export class AppModule {}
