import { useRouter } from 'next/compat/router'
import { Button } from 'ui'
import { auth } from '~/lib/userAuth'
import { LayoutMainContent } from '~/layouts/DefaultLayout'
import { TopNavSkeleton } from '~/layouts/MainSkeleton'

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
    <TopNavSkeleton>
      <LayoutMainContent className="p-4 flex items-center justify-center !min-h-[calc(90vh-60px)]">
        <section className="gap-4 text-center flex flex-col items-center max-w-2xl">
          <h1 className="text-xl">Sign in</h1>
          <p className="text-light text-sm mb-4">
            This is a dev-only route to sign in and test authenticated actions within docs. In
            staging and production, signin is managed via dashboard because docs and dashboard are
            proxied to the same domain.
          </p>
          <form className="flex gap-2 max-w-sm">
            <Button type="primary" size="small" onClick={signInWithGitHub}>
              Sign in with GitHub
            </Button>
            <Button type="default" size="small" onClick={signOut}>
              Sign out
            </Button>
          </form>
        </section>
      </LayoutMainContent>
    </TopNavSkeleton>
  )
}
