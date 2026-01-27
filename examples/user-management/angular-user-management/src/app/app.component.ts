import { Component, OnInit } from '@angular/core'
import { User } from '@supabase/supabase-js'
import { SupabaseService } from './supabase.service'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: false,
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
