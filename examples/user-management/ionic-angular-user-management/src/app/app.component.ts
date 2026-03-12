import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  constructor(private supabase: SupabaseService, private router: Router) {
    this.supabase.authChanges((_, session) => {
      console.log(session);
      if (session?.user) {
        this.router.navigate(['/account']);
      }
    });
  }
}
