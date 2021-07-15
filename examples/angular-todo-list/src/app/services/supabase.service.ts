import { Injectable } from '@angular/core'
import {
  AuthChangeEvent,
  createClient,
  Provider,
  Session,
  SupabaseClient,
} from '@supabase/supabase-js'
import { environment } from '../../environments/environment'

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabaseClient: SupabaseClient
  token: string | undefined

  constructor() {
    this.supabaseClient = createClient(environment.supabaseUrl, environment.supabaseKey)
  }

  getSession(): Session | null {
    return this.supabaseClient.auth.session()
  }

  signUp(email: string, password: string) {
    return this.supabaseClient.auth.signUp({ email, password })
  }

  signIn(email: string, password: string) {
    return this.supabaseClient.auth.signIn({ email, password })
  }

  signInWithProvider(provider: Provider) {
    return this.supabaseClient.auth.signIn({ provider })
  }

  signOut() {
    this.supabaseClient.auth.signOut().catch(console.error)
  }

  authChanges(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return this.supabaseClient.auth.onAuthStateChange(callback)
  }

  resetPassword(email: string) {
    return this.supabaseClient.auth.api.resetPasswordForEmail(email)
  }

  handleNewPassword(newPassword: string) {
    return this.supabaseClient.auth.api.updateUser(this.token as string, {
      password: newPassword,
    })
  }

  fetchTodos() {
    return this.supabaseClient.from('todos').select('*').order('id', { ascending: false })
  }

  addTodo(task: string) {
    const userId = this.getSession()?.user?.id as string
    return this.supabaseClient.from('todos').insert({ task, user_id: userId }).single()
  }

  toggleComplete(id: string, isCompleted: boolean) {
    return this.supabaseClient
      .from('todos')
      .update({ is_complete: !isCompleted })
      .eq('id', id)
      .single()
  }

  deleteTodo(id: string) {
    return this.supabaseClient.from('todos').delete().eq('id', id)
  }
}
