import { useStore } from 'hooks'
import { usePushNext } from 'hooks/misc/useAutoAuthRedirect'
import { IS_PLATFORM } from 'lib/constants'
import { auth, getReturnToPath, STORAGE_KEY } from 'lib/gotrue'
import { observer } from 'mobx-react-lite'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { PropsWithChildren, useEffect, useState } from 'react'
import { tweets } from 'shared-data'
import { useSWRConfig } from 'swr'
import { Button, IconFileText } from 'ui'

type SignInLayoutProps = {
  heading: string
  subheading: string
  showDisclaimer?: boolean
  logoLinkToMarketingSite?: boolean
}

const SignInLayout = ({
  heading,
  subheading,
  showDisclaimer = true,
  logoLinkToMarketingSite = false,
  children,
}: PropsWithChildren<SignInLayoutProps>) => {
  const pushNext = usePushNext()
  const { ui } = useStore()
  const { cache } = useSWRConfig()
  const { theme } = ui

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const hasReturnTo = searchParams.has('returnTo')
    const hasNext = searchParams.has('next')
    const shouldRedirect = !hasReturnTo && !hasNext

    if (!shouldRedirect) {
      // If there's a returnTo or next, then this redirect will be handled by useAutoAuthRedirect() in _app.tsx
      return
    }

    ;(async () => {
      const { error } = await auth.initialize()

      if (error) {
        // if there was a problem signing in via the url, don't redirect
        return
      }

      const {
        data: { session },
      } = await auth.getSession()

      if (session) {
        // .clear() does actually exist on the cache object, but it's not in the types 🤦🏻
        // @ts-ignore
        cache.clear()

        await pushNext()
      }
    })()
  }, [])

  const [quote, setQuote] = useState<{
    text: string
    url: string
    handle: string
    img_url: string
  } | null>(null)

  useEffect(() => {
    const randomQuote = tweets[Math.floor(Math.random() * tweets.length)]

    setQuote(randomQuote)
  }, [])

  return (
    <>
      {IS_PLATFORM && (
        <Head>
          <script
            dangerouslySetInnerHTML={{
              __html: `window._getReturnToPath = ${getReturnToPath.toString()};if (localStorage.getItem('${STORAGE_KEY}') && !(new URLSearchParams(location.search).has('next'))) {location.replace(window._getReturnToPath())}`,
            }}
          />
        </Head>
      )}

      <div className="flex flex-col flex-1 bg-scale-100">
        <div className="absolute top-0 w-full px-8 pt-6 mx-auto sm:px-6 lg:px-8">
          <nav className="relative flex items-center justify-between sm:h-10">
            <div className="flex items-center flex-grow flex-shrink-0 lg:flex-grow-0">
              <div className="flex items-center justify-between w-full md:w-auto">
                <Link href={logoLinkToMarketingSite ? 'https://supabase.com' : '/projects'}>
                  <a>
                    <Image
                      src={theme == 'dark' ? '/img/supabase-dark.svg' : '/img/supabase-light.svg'}
                      alt="Supabase Logo"
                      height={24}
                      width={120}
                    />
                  </a>
                </Link>
              </div>
            </div>

            <div className="items-center hidden space-x-3 md:ml-10 md:flex md:pr-4">
              <Link href="https://supabase.com/docs">
                <a target="_blank">
                  <Button type="default" icon={<IconFileText />}>
                    Documentation
                  </Button>
                </a>
              </Link>
            </div>
          </nav>
        </div>

        <div className="flex flex-1">
          <main className="flex flex-col items-center flex-1 flex-shrink-0 px-5 pt-16 pb-8 border-r shadow-lg bg-scale-200 border-scale-500">
            <div className="flex-1 flex flex-col justify-center w-[384px]">
              <div className="mb-10">
                <h1 className="mt-8 mb-2 text-2xl lg:text-3xl">{heading}</h1>
                <h2 className="text-sm text-scale-1100">{subheading}</h2>
              </div>

              {children}
            </div>

            {showDisclaimer && (
              <div className="sm:text-center">
                <p className="text-xs text-scale-900 sm:mx-auto sm:max-w-sm">
                  By continuing, you agree to Supabase's{' '}
                  <Link href="https://supabase.com/terms">
                    <a className="underline hover:text-scale-1100">Terms of Service</a>
                  </Link>{' '}
                  and{' '}
                  <Link href="https://supabase.com/privacy">
                    <a className="underline hover:text-scale-1100">Privacy Policy</a>
                  </Link>
                  , and to receive periodic emails with updates.
                </p>
              </div>
            )}
          </main>

          <aside className="flex-col items-center justify-center flex-1 flex-shrink hidden basis-1/4 xl:flex">
            {quote !== null && (
              <div className="relative flex flex-col gap-6">
                <div className="absolute select-none -top-12 -left-11">
                  <span className="text-[160px] leading-none text-scale-600">{'“'}</span>
                </div>

                <blockquote className="z-10 max-w-lg text-3xl">{quote.text}</blockquote>

                <a
                  href={quote.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4"
                >
                  <img
                    src={`https://supabase.com${quote.img_url}`}
                    alt={quote.handle}
                    className="w-12 h-12 rounded-full"
                  />

                  <div className="flex flex-col">
                    <cite className="not-italic font-medium text-scale-1100 whitespace-nowrap">
                      @{quote.handle}
                    </cite>
                  </div>
                </a>
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  )
}

export default observer(SignInLayout)
