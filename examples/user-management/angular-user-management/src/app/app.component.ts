import { Component, OnInit } from '@angular/core'
import { User } from '@supabase/supabase-js'
import { SupabaseService } from './supabase.service'
import { CommonModule } from '@angular/common'
import { AccountComponent } from './account/account.component'
import { AuthComponent } from './auth/auth.component'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [CommonModule , AccountComponent, AuthComponent],
})
export class AppComponent implements OnInit {
  constructor(private readonly supabase: SupabaseService) {}

  title = 'angular-user-management'
  user: User | null = null

  async ngOnInit() {
    this.user = await this.supabase.getUser()
    this.supabase.authChanges(async () => {
      this.user = await this.supabase.getUser()
    })
  }
}
