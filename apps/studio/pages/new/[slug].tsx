import Head from 'next/head'
import { PropsWithChildren } from 'react'

import { ProjectCreationForm } from '@/components/interfaces/ProjectCreation/ProjectCreationForm'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { WizardLayoutWithoutAuth } from '@/components/layouts/WizardLayout'
import { useCustomContent } from '@/hooks/custom-content/useCustomContent'
import { withAuth } from '@/hooks/misc/withAuth'
import { buildStudioPageTitle } from '@/lib/page-title'
import type { NextPageWithLayout } from '@/types'

const Wizard: NextPageWithLayout = () => {
  const { appTitle } = useCustomContent(['app:title'])
  const pageTitle = buildStudioPageTitle({
    section: 'New Project',
    brand: appTitle || 'Supabase',
  })

  return (
    <>
      {/* Wizard layouts set the visual header but not the browser tab title. */}
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content="Supabase Studio" />
      </Head>
      <ProjectCreationForm />
    </>
  )
}

const PageLayout = withAuth(({ children }: PropsWithChildren) => {
  return <WizardLayoutWithoutAuth>{children}</WizardLayoutWithoutAuth>
})

Wizard.getLayout = (page) => (
  <DefaultLayout hideMobileMenu headerTitle="New project">
    <PageLayout>{page}</PageLayout>
  </DefaultLayout>
)

export default Wizard
