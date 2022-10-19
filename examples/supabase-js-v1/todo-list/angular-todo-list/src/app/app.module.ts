import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'

import { AppComponent } from './app.component'
import { ReactiveFormsModule } from '@angular/forms'
import { AuthComponent } from './components/auth/auth.component'
import { HomeComponent } from './components/home/home.component'
import { AppRoutingModule } from './app-routing.module'
import { TodoItemComponent } from './components/todo-item/todo-item.component'
import { RecoveryPasswordComponent } from './components/recovery-password/recovery-password.component'

@NgModule({
  declarations: [
    AppComponent,
    AuthComponent,
    HomeComponent,
    TodoItemComponent,
    RecoveryPasswordComponent,
  ],
  imports: [BrowserModule, ReactiveFormsModule, AppRoutingModule],
  bootstrap: [AppComponent],
})
export class AppModule {}
