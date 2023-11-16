import { NextPage } from 'next'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Image from 'next/legacy/image'
import { Button } from 'ui'
import { observer } from 'mobx-react-lite'

import { useSignOut } from 'lib/auth'
import { useTheme } from 'next-themes'

const Error500: NextPage = () => {
  const router = useRouter()
  const { resolvedTheme } = useTheme()

  const signOut = useSignOut()
  const onClickLogout = async () => {
    await signOut()
    await router.push('/sign-in')
    router.reload()
  }

  return (
    <div className="relative mx-auto flex flex-1 w-full flex-col items-center justify-center space-y-6">
      <div className="absolute top-0 mx-auto w-full max-w-7xl px-8 pt-6 sm:px-6 lg:px-8">
        <nav className="relative flex items-center justify-between sm:h-10">
          <div className="flex flex-shrink-0 flex-grow items-center lg:flex-grow-0">
            <div className="flex w-full items-center justify-between md:w-auto">
              <Link href="/projects">
                <Image
                  src={
                    resolvedTheme === 'dark'
                      ? `${router.basePath}/img/supabase-dark.svg`
                      : `${router.basePath}/img/supabase-light.svg`
                  }
                  alt=""
                  height={24}
                  width={120}
                />
              </Link>
            </div>
          </div>
        </nav>
      </div>
      <div className="flex w-[320px] flex-col items-center justify-center space-y-3">
        <h4 className="text-lg">Something went wrong 🤕</h4>
        <p className="text-center">
          Sorry about that, please try again later or feel free to reach out to us if the problem
          persists.
        </p>
      </div>
      <div className="flex items-center space-x-4">
        {router.pathname !== '/projects' ? (
          <Button asChild>
            <Link href="/projects">Head back</Link>
          </Button>
        ) : (
          <Button onClick={onClickLogout}>Head back</Button>
        )}
        <Button type="secondary" asChild>
          <Link href="/support/new">Submit a support request</Link>
        </Button>
      </div>
    </div>
  )
}

export default observer(Error500)
