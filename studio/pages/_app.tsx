import 'styles/main.scss'
import 'styles/editor.scss'
import 'styles/ui.scss'
import 'styles/storage.scss'
import 'styles/stripe.scss'
import 'styles/toast.scss'
import 'styles/code.scss'
import 'styles/monaco.scss'
import 'styles/contextMenu.scss'
import 'styles/react-data-grid-logs.scss'
import 'styles/date-picker.scss'

import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

import Head from 'next/head'
import { AppPropsWithLayout } from 'types'

import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { RootStore } from 'stores'
import { StoreProvider } from 'hooks'
import { getParameterByName } from 'lib/common/fetch'
import { GOTRUE_ERRORS } from 'lib/constants'

import { PortalToast, GoTrueWrapper, RouteValidationWrapper } from 'components/interfaces/App'
import PageTelemetry from 'components/ui/PageTelemetry'
import FlagProvider from 'components/ui/Flag/FlagProvider'

dayjs.extend(customParseFormat)
dayjs.extend(timezone)
dayjs.extend(utc)

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  const [rootStore] = useState(() => new RootStore())
  const router = useRouter()

  useEffect(() => {
    const errorDescription = getParameterByName('error_description', router.asPath)
    if (errorDescription === GOTRUE_ERRORS.UNVERIFIED_GITHUB_USER) {
      rootStore.ui.setNotification({
        category: 'error',
        message:
          'Please verify your email on GitHub first, then reach out to us at support@supabase.io to log into the dashboard',
      })
    }
  }, [])

  const getLayout = Component.getLayout ?? ((page) => page)

  return (
    <StoreProvider rootStore={rootStore}>
      <FlagProvider>
        <Head>
          <title>Supabase</title>
          <meta name="viewport" content="initial-scale=1.0, width=device-width" />
          <link rel="stylesheet" type="text/css" href="/css/fonts.css" />
        </Head>
        <GoTrueWrapper>
          <PageTelemetry>
            <RouteValidationWrapper>
              {getLayout(<Component {...pageProps} />)}
            </RouteValidationWrapper>
          </PageTelemetry>
        </GoTrueWrapper>
        <PortalToast />
      </FlagProvider>
    </StoreProvider>
  )
}
export default MyApp
