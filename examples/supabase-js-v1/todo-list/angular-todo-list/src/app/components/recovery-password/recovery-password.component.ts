import { Component } from '@angular/core'
import { SupabaseService } from '../../services/supabase.service'
import { FormControl, Validators } from '@angular/forms'
import { Router } from '@angular/router'

@Component({
  selector: 'app-recovery-password',
  templateUrl: './recovery-password.component.html',
})
export class RecoveryPasswordComponent {
  passwordControl: FormControl = new FormControl('', Validators.required)
  constructor(private readonly supabase: SupabaseService, private readonly router: Router) {}

  async handleNewPassword(): Promise<void> {
    if (this.passwordControl.valid) {
      try {
        await this.supabase.handleNewPassword(this.passwordControl.value)
        await this.router.navigate(['/'])
      } catch (error) {
        console.error(error)
      }
    }
  }
}
