import { useTheme } from 'next-themes'
import Image from 'next/legacy/image'
import Link from 'next/link'
import type { PropsWithChildren } from 'react'
import { Separator } from 'ui'

import { Head, type HeadProvider } from '@/components/ui/Head'
import { useCustomContent } from '@/hooks/custom-content/useCustomContent'
import { BASE_PATH } from '@/lib/constants'

export interface APIAuthorizationLayoutProps {
  HeadProvider: HeadProvider
}

export const APIAuthorizationLayout = ({
  HeadProvider,
  children,
}: PropsWithChildren<APIAuthorizationLayoutProps>) => {
  const { resolvedTheme } = useTheme()
  const { appTitle } = useCustomContent(['app:title'])

  return (
    <>
      <Head
        HeadProvider={HeadProvider}
        title={`Authorize API access | ${appTitle || 'Supabase'}`}
      />
      <main className="h-screen flex flex-col w-full h-full overflow-y-auto">
        <div>
          <div className="mx-auto px-4 sm:px-6">
            <div className="max-w-xl flex justify-between items-center mx-auto py-4">
              <div className="flex justify-start lg:w-0 lg:flex-1 items-center">
                <Link href="/">
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
                </Link>
              </div>
            </div>
          </div>
        </div>
        <Separator />
        <div className="flex flex-col justify-center flex-grow mx-auto w-[90vw] max-w-[600px] space-y-4">
          {children}
        </div>
      </main>
    </>
  )
}
