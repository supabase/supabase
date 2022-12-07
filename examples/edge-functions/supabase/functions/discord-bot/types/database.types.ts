export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      discord_promise_challenge: {
        Row: {
          id: number
          user_id: string
          username: string
          promise: string
          email: string | null
          submission: string | null
          inserted_at: string
          updated_at: string
          resolved: boolean | null
        }
        Insert: {
          id?: number
          user_id: string
          username: string
          promise: string
          email?: string | null
          submission?: string | null
          inserted_at?: string
          updated_at?: string
          resolved?: boolean | null
        }
        Update: {
          id?: number
          user_id?: string
          username?: string
          promise?: string
          email?: string | null
          submission?: string | null
          inserted_at?: string
          updated_at?: string
          resolved?: boolean | null
        }
      }
      users: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
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

