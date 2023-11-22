import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'

export default async function SSRTester() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // console.log({ countries })
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center gap-y-4">
      <div className="flex items-center gap-x-1.5 font-mono text-xl">
        <span>database</span>
        <div className="w-1.5 h-1.5 rounded-full bg-purple-900"></div>
        <span>new</span>
        {user ? user.email : 'no user'}
      </div>
      <p>
        <Link href="sign-up">Sign up</Link>
      </p>
    </main>
  )
}
