import { RefreshCw } from 'lucide-react'
import { useTheme } from 'next-themes'
import Head from 'next/head'

import { BASE_PATH } from 'lib/constants'
import type { NextPageWithLayout } from 'types'
import { Button, cn } from 'ui'
import { useMemo } from 'react'

const MaintenancePage: NextPageWithLayout = () => {
  const { resolvedTheme } = useTheme()
  const isDarkMode = resolvedTheme?.includes('dark')

  const imgUrl = useMemo(
    () =>
      isDarkMode ? `${BASE_PATH}/img/supabase-dark.svg` : `${BASE_PATH}/img/supabase-light.svg`,
    [isDarkMode]
  )

  return (
    <>
      <Head>
        <title>Supabase | Under Maintenance</title>
      </Head>
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex items-center justify-center mb-4">
          <img src={imgUrl} alt="Supabase" className="h-8" />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-medium text-foreground">Under Maintenance</h1>
          <p className="text-foreground-light max-w-xs mx-auto">
            We are currently improving our services. The dashboard will be back online shortly.
          </p>
        </div>
        <p className="text-sm text-foreground-lighter max-w-xs mx-auto">
          If you need support while the dashboard is inaccessible, you can email us at{' '}
          <a
            href="mailto:support+maintenance@supabase.io"
            className="text-foreground-light underline hover:text-foreground"
          >
            support+maintenance@supabase.io
          </a>
        </p>
        <div className="flex flex-col items-center gap-2 mt-4">
          <p className="text-sm text-foreground-lighter">
            Reload the page to check if the maintenance window has ended
          </p>
          <Button onClick={() => window.location.reload()} type="primary" icon={<RefreshCw />}>
            Reload
          </Button>
        </div>
      </div>
    </>
  )
}

MaintenancePage.getLayout = (page) => (
  <div
    className={cn(
      'flex h-full min-h-screen bg-studio',
      'w-full flex-col place-items-center',
      'items-center justify-center gap-8 px-5'
    )}
  >
    {page}
  </div>
)

export default MaintenancePage
