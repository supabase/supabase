import { useStore } from 'hooks'
import { observer } from 'mobx-react-lite'
import Image from 'next/image'
import Link from 'next/link'
import { PropsWithChildren } from 'react'

type ForgotPasswordLayoutProps = {
  heading: string
  subheading: string
  logoLinkToMarketingSite?: boolean
  showHeadings?: boolean
}

const ForgotPasswordLayout = ({
  heading,
  subheading,
  logoLinkToMarketingSite = false,
  showHeadings = true,
  children,
}: PropsWithChildren<ForgotPasswordLayoutProps>) => {
  const {
    ui: { theme },
  } = useStore()

  return (
    <div className="flex-1 bg-scale-200 flex flex-col gap-8 lg:gap-16 xl:gap-32">
      <div className="sticky top-0 mx-auto w-full max-w-7xl px-8 pt-6 sm:px-6 lg:px-8">
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
        </nav>
      </div>

      <div className="flex flex-col justify-center items-center">
        <main className="max-w-[448px] w-full flex flex-col px-5">
          {showHeadings && (
            <div className="mb-6">
              <h1 className="text-2xl lg:text-3xl mt-8 mb-2">{heading}</h1>
              <h2 className="text-scale-1100 text-sm">{subheading}</h2>
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  )
}

export default observer(ForgotPasswordLayout)
