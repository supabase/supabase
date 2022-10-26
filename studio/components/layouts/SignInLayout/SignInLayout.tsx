import { useStore } from 'hooks'
import { auth, STORAGE_KEY } from 'lib/gotrue'
import { observer } from 'mobx-react-lite'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { PropsWithChildren, useEffect, useState } from 'react'
import { tweets } from 'shared-data'

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
  const { ui } = useStore()

  const { theme } = ui

  useEffect(() => {
    ;(async () => {
      const { error } = await auth.initialize()

      if (error) {
        ui.setNotification({
          category: 'error',
          message: error.message,
        })
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
      <Head>
        <script
          dangerouslySetInnerHTML={{
            __html: `if (window.localStorage.getItem('${STORAGE_KEY}')) {window.location.replace('/projects')}`,
          }}
        />
      </Head>

      <div className="flex-1 flex flex-col bg-scale-100">
        <div className="absolute top-0 mx-auto w-full px-8 pt-6 sm:px-6 lg:px-8">
          <nav className="relative flex items-center justify-between sm:h-10">
            <div className="flex flex-shrink-0 flex-grow items-center lg:flex-grow-0">
              <div className="flex w-full items-center justify-between md:w-auto">
                <Link href={logoLinkToMarketingSite ? 'https://supabase.com' : '/projects'}>
                  <a>
                    <Image
                      src={theme == 'dark' ? '/img/supabase-dark.svg' : '/img/supabase-light.svg'}
                      alt=""
                      height={24}
                      width={120}
                    />
                  </a>
                </Link>
              </div>
            </div>

            <div className="hidden items-center space-x-3 md:ml-10 md:flex md:pr-4">
              <a
                href="https://supabase.com/docs"
                className="text-sm text-scale-1100 transition-colors hover:text-scale-1200"
              >
                Documentation
              </a>
            </div>
          </nav>
        </div>

        <div className="flex-1 flex">
          <main className="flex-1 flex-shrink-0 flex flex-col items-center bg-scale-200 px-5 pt-16 pb-8 border-r border-scale-500 shadow-lg">
            <div className="flex-1 flex flex-col justify-center w-[384px]">
              <div className="mb-10">
                <h1 className="text-4xl mt-8 mb-2">{heading}</h1>
                <h2 className="text-scale-1100">{subheading}</h2>
              </div>

              {children}
            </div>

            {showDisclaimer && (
              <div className="sm:text-center">
                <p className="text-xs text-scale-900 sm:mx-auto sm:max-w-sm">
                  By continuing, you agree to Supabase's{' '}
                  <Link href="https://supabase.com/docs/company/terms">
                    <a className="underline hover:text-scale-1100">Terms of Service</a>
                  </Link>{' '}
                  and{' '}
                  <Link href="https://supabase.com/docs/company/privacy">
                    <a className="underline hover:text-scale-1100">Privacy Policy</a>
                  </Link>
                  , and to receive periodic emails with updates.
                </p>
              </div>
            )}
          </main>

          <aside className="hidden flex-1 flex-shrink basis-1/4 xl:flex flex-col justify-center items-center">
            {quote !== null && (
              <div className="relative flex flex-col gap-6">
                <div className="absolute -top-12 -left-11 select-none">
                  <span className="text-[160px] leading-none text-scale-600">{'“'}</span>
                </div>

                <blockquote className="text-3xl z-10 max-w-lg">{quote.text}</blockquote>

                <a
                  href={quote.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4"
                >
                  <img
                    src={`https://supabase.com${quote.img_url}`}
                    alt={quote.handle}
                    className="rounded-full w-12 h-12"
                  />

                  <div className="flex flex-col">
                    <cite className="font-medium not-italic text-scale-1100 whitespace-nowrap">
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
