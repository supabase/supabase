import { useStore } from 'hooks'
import { observer } from 'mobx-react-lite'
import Image from 'next/image'
import Link from 'next/link'
import { PropsWithChildren } from 'react'

type ForgotPasswordLayoutProps = {
  title: string
  showDisclaimer?: boolean
  logoLinkToMarketingSite?: boolean
}

const ForgotPasswordLayout = ({
  title,
  showDisclaimer = true,
  logoLinkToMarketingSite = false,
  children,
}: PropsWithChildren<ForgotPasswordLayoutProps>) => {
  const {
    ui: { theme },
  } = useStore()

  return (
    <div className="flex flex-col gap-8 mb-5">
      <div className="sticky top-0 mx-auto w-full max-w-7xl px-8 pt-6 sm:px-6 lg:px-8">
        <nav className="relative flex items-center justify-between sm:h-10">
          <div className="flex flex-shrink-0 flex-grow items-center lg:flex-grow-0">
            <div className="flex w-full items-center justify-between md:w-auto">
              <Link href={logoLinkToMarketingSite ? 'https://supabase.com' : '/'}>
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

      <h1 className="text-2xl self-center mt-8">{title}</h1>

      <div className="flex flex-col justify-center items-center">
        <main className="min-w-[448px] flex flex-col bg-scale-400 px-5 rounded-lg shadow-lg">
          <img
            src="/supabase-logo.svg"
            alt="Supabase Logo"
            className="block w-20 mt-8 mb-10 self-center"
          />

          {children}
        </main>
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
    </div>
  )
}

export default observer(ForgotPasswordLayout)
