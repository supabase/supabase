import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core'
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { SupabaseService } from '../supabase.service'

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css'],
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthComponent {
  signInForm!: FormGroup
  private readonly supabase = inject(SupabaseService)
  private readonly formBuilder = inject(FormBuilder)

  loading = signal(false)
  ngOnInit() {
    this.signInForm = this.formBuilder.group({
      email: '',
    })
  }

  async onSubmit(): Promise<void> {
    try {
      this.loading.set(true)
      const email = this.signInForm.value.email as string
      const { error } = await this.supabase.signIn(email)
      if (error) throw error
      alert('Check your email for the login link!')
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message)
      }
    } finally {
      this.signInForm.reset()
      this.loading.set(false)
    }
  }
}
