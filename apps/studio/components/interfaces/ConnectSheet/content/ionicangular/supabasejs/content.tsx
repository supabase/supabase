import { MultipleCodeBlock } from 'ui-patterns/MultipleCodeBlock'

import type { StepContentProps } from '@/components/interfaces/ConnectSheet/Connect.types'

const ContentFile = ({ projectKeys }: StepContentProps) => {
  const files = [
    {
      name: 'environments/environment.ts',
      language: 'ts',
      code: `
export const environment = {
  supabaseUrl: '${projectKeys.apiUrl ?? 'your-project-url'}',
  supabaseKey: '${projectKeys.publishableKey ?? '<prefer publishable key instead of anon key for mobile apps>'}',
};
`,
    },
    {
      name: 'src/app/supabase.service.ts',
      language: 'ts',
      code: `
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;
  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  getTodos() {
    return this.supabase.from('todos').select('*');
  }
}
`,
    },
    {
      name: 'src/app/app.component.ts',
      language: 'ts',
      code: `
import { Component, OnInit } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  todos: any[] = [];

  constructor(private supabaseService: SupabaseService) {}

  async ngOnInit() {
    await this.loadTodos();
  }

  async loadTodos() {
    const { data, error } = await this.supabaseService.getTodos();
    if (error) {
      console.error('Error fetching todos:', error);
    } else {
      this.todos = data;
    }
  }
}
`,
    },
    {
      name: 'src/app/app.component.html',
      language: 'html',
      code: `
<ion-header>
<ion-toolbar>
  <ion-title>Todo List</ion-title>
</ion-toolbar>
</ion-header>

<ion-content>
<ion-list>
  <ion-item *ngFor="let todo of todos">
    <ion-label>{{ todo.name }}</ion-label>
  </ion-item>
</ion-list>
</ion-content>
`,
    },
    {
      name: 'src/app/app.module.ts',
      language: 'ts',
      code: `
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { AppComponent } from './app.component';
import { SupabaseService } from './supabase.service';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    RouterModule.forRoot([]),
    IonicModule.forRoot({ mode: 'ios' }),
  ],
  declarations: [AppComponent],
  providers: [SupabaseService],
  bootstrap: [AppComponent],
})
export class AppModule {}
`,
    },
  ]

  return <MultipleCodeBlock files={files} />
}

export default ContentFile
