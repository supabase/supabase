import { createClient } from '@/lib/supabase/server'
import { Github } from 'lucide-react'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default function Login({ searchParams }: { searchParams: { message: string } }) {
  const signUp = async (formData: FormData) => {
    'use server'

    const origin = headers().get('origin')
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

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
        <button className="border text-sm bg-surface-100 rounded-md px-4 py-2 text-foreground mb-2 flex items-center justify-center gap-x-2">
          <Github size={18} />
          Sign in with Github
        </button>
        {searchParams?.message && (
          <p className="mt-4 p-4 bg-foreground/10 text-foreground text-center">
            {searchParams.message}
          </p>
        )}
      </form>
    </div>
  )
}
