import { Component, OnInit } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  standalone: false,
})
export class AppComponent implements OnInit {
  constructor(private readonly supabase: SupabaseService) {}

  title = 'angular-user-management';
  session: any;

  ngOnInit() {
    this.session = this.supabase.session;
    this.supabase.authChanges((_, session) => (this.session = session));
  }
}
