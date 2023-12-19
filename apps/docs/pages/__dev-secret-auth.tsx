import { useRouter } from 'next/router'
import { Button_Shadcn_ } from 'ui'
import { auth } from '~/lib/userAuth'

export function getServerSideProps() {
  if (process.env.NEXT_PUBLIC_DEV_AUTH_PAGE === 'true') {
    return {
      props: {},
    }
  }
  return {
    notFound: true,
  }
}

export default function DevOnlySecretAuth() {
  const router = useRouter()

  function signIn() {
    auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo:
          process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview'
            ? location.origin
            : process.env.NEXT_PUBLIC_SITE_URL,
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
    <div className="p-10 flex items-center justify-center">
      <section className="space-y-4">
        <h1>Sign in</h1>
        <p>
          This is a dev and staging-only route to sign in and test authenticated actions within
          docs. In production, signin is managed via dashboard because docs and dashboard are on the
          same domain.
        </p>
        <div className="flex flex-col gap-2 max-w-sm">
          <Button_Shadcn_ onClick={() => signIn()}> Sign in with GitHub</Button_Shadcn_>
          <Button_Shadcn_ onClick={signOut}>Sign out</Button_Shadcn_>
        </div>
      </section>
    </div>
  )
}
