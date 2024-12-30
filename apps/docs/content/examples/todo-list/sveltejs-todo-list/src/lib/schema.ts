export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      todos: {
        Row: {
          id: number
          user_id: string
          task: string | null
          is_complete: boolean | null
          inserted_at: string
        }
        Insert: {
          id?: number
          user_id: string
          task?: string | null
          is_complete?: boolean | null
          inserted_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          task?: string | null
          is_complete?: boolean | null
          inserted_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
