import { createFileRoute } from '@tanstack/react-router'
import Head from 'next/head'

import { APIAuthorizationLayout } from '@/components/layouts/APIAuthorizationLayout'
import APIAuthorizationPage from '@/pages/authorize'

export const Route = createFileRoute('/authorize')({
  component: Authorize,
})

function Authorize() {
  return (
    <APIAuthorizationLayout HeadProvider={Head}>
      <APIAuthorizationPage dehydratedState={undefined} />
    </APIAuthorizationLayout>
  )
}
