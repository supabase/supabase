import { useCustomContent } from 'hooks/custom-content/useCustomContent'
import { BASE_PATH } from 'lib/constants'
import { useTheme } from 'next-themes'
import Head from 'next/head'
import Image from 'next/legacy/image'
import type { PropsWithChildren } from 'react'
import { Separator } from 'ui'
import { withAuth } from '../../hooks/misc/withAuth'

export interface RedeemCreditsLayoutProps {}

const RedeemCreditsLayout = ({ children }: PropsWithChildren<RedeemCreditsLayoutProps>) => {
  const { resolvedTheme } = useTheme()
  const { appTitle } = useCustomContent(['app:title'])

  return (
    <>
      <Head>
        <title>Redeem Credits | {appTitle || 'Supabase'}</title>
      </Head>
      <main className="flex flex-col flex-grow w-full h-full overflow-y-auto">
        <div>
          <div className="mx-auto px-4 sm:px-6">
            <div className="max-w-xl flex justify-between items-center py-4">
              <div className="flex justify-start lg:w-0 lg:flex-1">
                <div>
                  <span className="sr-only">Supabase</span>
                  <Image
                    src={
                      resolvedTheme?.includes('dark')
                        ? `${BASE_PATH}/img/supabase-dark.svg`
                        : `${BASE_PATH}/img/supabase-light.svg`
                    }
                    alt="Supabase Logo"
                    height={20}
                    width={105}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <Separator />
        <div className="flex flex-col justify-center flex-grow mx-auto w-[90vw] space-y-4">
          {children}
        </div>
      </main>
    </>
  )
}

export default withAuth(RedeemCreditsLayout)
