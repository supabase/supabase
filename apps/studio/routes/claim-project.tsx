import { createFileRoute } from '@tanstack/react-router'
import Head from 'next/head'

import { useCustomContent } from '@/hooks/custom-content/useCustomContent'
import ClaimProjectPage from '@/pages/claim-project'

export const Route = createFileRoute('/claim-project')({
  component: ClaimProject,
})

function ClaimProject() {
  const { appTitle } = useCustomContent(['app:title'])

  return (
    <>
      <Head>
        <title>{`Claim project | ${appTitle ?? 'Supabase'}`}</title>
      </Head>
      <main className="flex flex-col w-full min-h-screen overflow-y-auto">
        <ClaimProjectPage dehydratedState={undefined} />
      </main>
    </>
  )
}
