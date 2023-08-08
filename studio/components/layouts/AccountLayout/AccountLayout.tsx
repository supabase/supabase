import Head from 'next/head'
import { PropsWithChildren } from 'react'

import { withAuth } from 'hooks'
import SettingsLayout from '../SettingsLayout/SettingsLayout'

export interface AccountLayoutProps {
  title: string
  breadcrumbs: {
    key: string
    label: string
  }[]
}

const AccountLayout = ({ children, title, breadcrumbs }: PropsWithChildren<AccountLayoutProps>) => {
  return (
    <>
      <Head>
        <title>{title ? `${title} | Supabase` : 'Supabase'}</title>
        <meta name="description" content="Supabase Studio" />
      </Head>
      <SettingsLayout>{children}</SettingsLayout>
    </>
  )
}

export default withAuth(AccountLayout)

export const AccountLayoutWithoutAuth = AccountLayout
