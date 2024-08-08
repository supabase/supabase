import { Button } from '@ui/components/Button'
import { Github } from 'lucide-react'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

export default function LoginForm({ searchParams }: { searchParams?: { message?: string } }) {
  const signUp = async () => {
    'use server'

    const origin = headers().get('origin')

    const supabase = createClient()

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${origin}/auth/callback` },
    })

    if (error) {
      console.log(error.message)
      return redirect(`/login?message=${error.message}`)
    } else {
      return redirect(data.url)
    }
  }

  return (
    <div className="flex flex-col justify-center h-full w-full px-8 sm:max-w-sm gap-2 mx-auto">
      <form
        className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-foreground"
        action={signUp}
      >
        <div className="flex items-center gap-x-2 justify-center mb-4">
          <span className="text-foreground-light">Sign in to</span>{' '}
          <div className="flex items-center gap-x-1.5 font-mono font-bold">
            <span>database</span>
            <div className="w-1.5 h-1.5 rounded-full bg-purple-900"></div>
            <span>design</span>
          </div>
        </div>
        <div className="grid gap-2 mb-4">
          <p className="text-center text-sm ">You need to sign in to generate a schema</p>
          <p className="text-center text-xs">Takes just a few seconds</p>
        </div>
        <Button
          className="border text-sm bg-surface-100 rounded-md px-4 py-2 text-foreground mb-2 flex items-center justify-center gap-x-2"
          type="default"
          htmlType="submit"
          icon={<Github size={18} />}
        >
          Sign in with Github
        </Button>

        {searchParams?.message && (
          <p className="mt-4 p-4 bg-foreground/10 text-foreground text-center">
            {searchParams.message}
          </p>
        )}
      </form>
    </div>
  )
}
