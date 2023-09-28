import { useQueryClient } from '@tanstack/react-query'
import { useTheme } from 'common'
import { useFlag } from 'hooks'
import { usePushNext } from 'hooks/misc/useAutoAuthRedirect'
import { BASE_PATH } from 'lib/constants'
import { auth, buildPathWithParams, getAccessToken } from 'lib/gotrue'
import { observer } from 'mobx-react-lite'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { PropsWithChildren, useEffect, useState } from 'react'
import { tweets } from 'shared-data'
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
  const router = useRouter()
  const pushNext = usePushNext()
  const queryClient = useQueryClient()
  const { isDarkMode } = useTheme()
  const ongoingIncident = useFlag('ongoingIncident')

  // This useEffect redirects the user to MFA if they're already halfway signed in
  useEffect(() => {
    auth
      .initialize()
      .then(async ({ error }) => {
        if (error) {
          // if there was a problem signing in via the url, don't redirect
          return
        }

        const token = await getAccessToken()

        if (token) {
          const { data, error } = await auth.mfa.getAuthenticatorAssuranceLevel()
          if (error) {
            // if there was a problem signing in via the url, don't redirect
            return
          }

          if (data) {
            // we're already where we need to be
            if (router.pathname === '/sign-in-mfa') {
              return
            }
            if (data.currentLevel !== data.nextLevel) {
              const redirectTo = buildPathWithParams('/sign-in-mfa')
              router.replace(redirectTo)
              return
            }
          }

          await queryClient.resetQueries()
          await pushNext()
        } else {
          // if the user doesn't have a token, he needs to go back to the sign-in page
          const redirectTo = buildPathWithParams('/sign-in')
          router.replace(redirectTo)
          return
        }
      })
      .catch(() => {}) // catch all errors thrown by auth methods
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
      <div className="flex flex-col flex-1 bg-scale-100">
        <div
          className={`absolute top-0 w-full px-8 mx-auto sm:px-6 lg:px-8 ${
            ongoingIncident ? 'pt-16' : 'pt-6'
          }`}
        >
          <nav className="relative flex items-center justify-between sm:h-10">
            <div className="flex items-center flex-grow flex-shrink-0 lg:flex-grow-0">
              <div className="flex items-center justify-between w-full md:w-auto">
                <Link href={logoLinkToMarketingSite ? 'https://supabase.com' : '/projects'}>
                  <a>
                    <Image
                      src={
                        isDarkMode
                          ? `${BASE_PATH}/img/supabase-dark.svg`
                          : `${BASE_PATH}/img/supabase-light.svg`
                      }
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
                <a target="_blank" rel="noreferrer">
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
            <div className="flex-1 flex flex-col justify-center w-[330px] sm:w-[384px]">
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
