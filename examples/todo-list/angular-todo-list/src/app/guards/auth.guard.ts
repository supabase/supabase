import { Injectable } from '@angular/core'
import { CanActivate, Router } from '@angular/router'
import { SupabaseService } from '../services/supabase.service'

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService, private readonly router: Router) {}

  canActivate(): boolean {
    const isSignedIn = !!this.supabase.getSession()?.user

    if (!isSignedIn) {
      this.router.navigate(['/auth'])
    }

    return isSignedIn
  }
}
