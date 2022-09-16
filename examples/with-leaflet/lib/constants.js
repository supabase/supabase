import { createContext } from 'react'

export const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
export const NEXT_PUBLIC_SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY

export const DEFAULT_AVATARS_BUCKET = 'avatars'

export const AppContext = createContext()
