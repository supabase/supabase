import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { AuthComponent } from './components/auth/auth.component'
import { HomeComponent } from './components/home/home.component'
import { AuthGuard } from './guards/auth.guard'
import { RecoveryPasswordGuard } from './guards/recovery-password.guard'
import { RecoveryPasswordComponent } from './components/recovery-password/recovery-password.component'

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    canActivate: [AuthGuard, RecoveryPasswordGuard],
  },
  {
    path: 'auth',
    component: AuthComponent,
  },
  {
    path: 'recovery-password',
    component: RecoveryPasswordComponent,
  },
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
