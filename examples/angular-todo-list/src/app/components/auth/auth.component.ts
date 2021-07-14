import { Component } from '@angular/core'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { SupabaseService } from '../../services/supabase.service'
import { Provider } from '@supabase/supabase-js'
import { Router } from '@angular/router'

interface HelperText {
  text: string
  error: boolean
}

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
})
export class AuthComponent {
  authForm: FormGroup = new FormGroup({
    email: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required),
  })

  helperText: HelperText | undefined

  constructor(private readonly supabase: SupabaseService, private readonly router: Router) {}

  async forgotPassword(): Promise<void> {
    const email = prompt('Please enter your email:')

    let { error } = await this.supabase.resetPassword(email as string)
    if (error) {
      console.error('Error: ', error.message)
    } else {
      this.helperText = {
        error: false,
        text: 'Password recovery email has been sent.',
      }
    }
  }

  async handleLogin(type: string): Promise<void> {
    const { email, password } = this.authForm.value

    const { user, error, session } =
      type === 'LOGIN'
        ? await this.supabase.signIn(email, password)
        : await this.supabase.signUp(email, password)

    if (user && type === 'LOGIN') {
      await this.router.navigate(['/'])
    } else if (error) {
      this.helperText = { error: true, text: error.message }
    } else if (user && !session && !error) {
      this.helperText = {
        error: false,
        text: 'An email has been sent to you for verification!',
      }
    }
  }

  async handleOAuthLogin(provider: Provider): Promise<void> {
    // You need to enable the third party auth you want in Authentication > Settings
    // Read more on: https://supabase.io/docs/guides/auth#third-party-logins
    let { error } = await this.supabase.signInWithProvider(provider)
    if (error) console.error('Error: ', error.message)
  }
}
