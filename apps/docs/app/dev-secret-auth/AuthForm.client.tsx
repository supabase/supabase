'use client'

import { useRouter } from 'next/navigation'

import { Button_Shadcn_ } from 'ui'

import { auth } from '~/lib/userAuth'

export function DevSecretAuthForm() {
  const router = useRouter()

  function signInWithGitHub() {
    auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: process.env.NEXT_PUBLIC_SITE_URL,
      },
    })
  }

  function signOut() {
    auth.signOut().then(({ error }) => {
      if (error) {
        throw error
      }

      router.push('/')
    })
  }

  return (
    <div className="p-10 flex items-center justify-center max-w-lg mx-auto">
      <section className="space-y-4">
        <h1>Sign in</h1>
        <p>
          This is a dev-only route to sign in and test authenticated actions within docs. In staging
          and production, signin is managed via dashboard because docs and dashboard are proxied to
          the same domain.
        </p>
        <form className="flex flex-col gap-2 max-w-sm">
          <Button_Shadcn_ type="button" variant="default" onClick={signInWithGitHub}>
            Sign in with GitHub
          </Button_Shadcn_>
          <Button_Shadcn_ type="button" variant="outline" onClick={signOut}>
            Sign out
          </Button_Shadcn_>
        </form>
      </section>
    </div>
  )
}
