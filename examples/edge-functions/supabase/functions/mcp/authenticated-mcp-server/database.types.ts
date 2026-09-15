// Minimal stand-in for `supabase gen types typescript --local`, enough to type-check the snippet.
export type Database = {
  public: {
    Tables: {
      todos: {
        Row: { id: string; user_id: string; title: string; done: boolean; created_at: string }
        Insert: {
          id?: string
          user_id?: string
          title: string
          done?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          done?: boolean
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
