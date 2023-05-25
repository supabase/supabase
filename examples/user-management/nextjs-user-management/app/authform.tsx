'use client'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useSupabase } from './supabase-provider'

export default function AuthForm() {
  const supabase = useSupabase()

  return (
    <Auth
      supabaseClient={supabase}
      view="magic_link"
      appearance={{ theme: ThemeSupa }}
      theme="dark"
      showLinks={false}
      providers={[]}
      redirectTo="http://localhost:3000/auth/callback"
    />
  )
}
