import { Component, OnInit } from '@angular/core'
import { FormControl, FormGroup } from '@angular/forms'
import { Todo } from '../../models/todo'
import { SupabaseService } from '../../services/supabase.service'
import { Router } from '@angular/router'

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  todos: Todo[] = []
  todoForm: FormGroup = new FormGroup({
    task: new FormControl(),
  })
  errorText: string | undefined | null

  constructor(private readonly supabase: SupabaseService, private readonly router: Router) {}

  ngOnInit(): void {
    this.fetchTodos()
  }

  async fetchTodos(): Promise<void> {
    let { data: todos, error } = await this.supabase.fetchTodos()
    if (error) {
      console.error('error', error.message)
    } else {
      this.todos = todos ?? []
    }
  }

  async addTodo(): Promise<void> {
    let task = this.todoForm.value.task.trim()
    if (task.length <= 3) {
      this.errorText = 'Task length should be more than 3!'
    } else {
      let { data: todo, error } = await this.supabase.addTodo(task)
      if (error) {
        this.errorText = error.message
      } else {
        this.todos = [todo, ...this.todos]
        this.errorText = null
        this.todoForm.reset()
      }
    }
  }

  async toggleComplete(id: string, is_complete: boolean): Promise<void> {
    try {
      await this.supabase.toggleComplete(id, is_complete)
      this.todos = this.todos.map((todo) => {
        if (todo.id === id) {
          return { ...todo, is_complete: !is_complete }
        }
        return todo
      })
    } catch (error) {
      console.error(error)
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.supabase.deleteTodo(id)
      this.todos = this.todos.filter((todo) => todo.id !== id)
    } catch (error) {
      console.error('error', error)
    }
  }

  async handleLogout(): Promise<void> {
    try {
      await this.supabase.signOut()
      await this.router.navigate(['/auth'])
    } catch (error) {
      console.error(error)
    }
  }
}
