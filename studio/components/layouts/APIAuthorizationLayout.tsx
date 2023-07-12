import Head from 'next/head'
import Image from 'next/image'
import { useTheme } from 'common'
import { PropsWithChildren } from 'react'
import { BASE_PATH } from 'lib/constants'
import Divider from 'components/ui/Divider'

export interface APIAuthorizationLayoutProps {}

const APIAuthorizationLayout = ({ children }: PropsWithChildren<APIAuthorizationLayoutProps>) => {
  const { isDarkMode } = useTheme()
  return (
    <>
      <Head>
        <title>Authorize API access | Supabase</title>
      </Head>
      <main className="flex-grow flex flex-col w-full h-full overflow-y-auto">
        <div>
          <div className="mx-auto px-4 sm:px-6">
            <div className="max-w-xl flex justify-between items-center mx-auto py-4">
              <div className="flex justify-start lg:w-0 lg:flex-1">
                <div>
                  <span className="sr-only">Supabase</span>
                  <Image
                    src={
                      isDarkMode
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
        <Divider light />
        <div className="flex flex-col justify-center flex-grow mx-auto max-w-[90vw] md:max-w-xl h-full space-y-4">
          {children}
        </div>
      </main>
    </>
  )
}

export default APIAuthorizationLayout
