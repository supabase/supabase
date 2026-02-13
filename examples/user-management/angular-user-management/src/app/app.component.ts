import { Component, inject, OnInit, signal } from '@angular/core'
import { User } from '@supabase/supabase-js'
import { SupabaseService } from './supabase.service'

import { AccountComponent } from './account/account.component'
import { AuthComponent } from './auth/auth.component'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [AccountComponent, AuthComponent],
})
export class AppComponent implements OnInit {
  private readonly supabase = inject(SupabaseService)
  user = signal<User | null>(null)

  async ngOnInit() {
    const user = await this.supabase.getUser()
    this.user.set(user)
    this.supabase.authChanges(async () => {
      const currentUser = await this.supabase.getUser()
      this.user.set(currentUser)
    })
  }
}
