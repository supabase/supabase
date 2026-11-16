import { useParams } from 'common'
import { PropsWithChildren } from 'react'

import { DatabaseLayout } from './DatabaseLayout'
import { PageLayout } from '@/components/layouts/PageLayout/PageLayout'
import { AlertError } from '@/components/ui/AlertError'
import { NoPermission } from '@/components/ui/NoPermission'
import { useGrant } from '@/lib/grants'

type DatabaseTriggersLayoutProps = PropsWithChildren

export const DatabaseTriggersLayout = ({ children }: DatabaseTriggersLayoutProps) => {
  const { ref } = useParams()
  const readGrant = useGrant(
    'POST /platform/pg-meta/{ref}/query',
    { projectRef: ref },
    { variant: 'read' }
  )

  const navigationItems = [
    {
      label: 'Data',
      href: `/project/${ref}/database/triggers/data`,
    },
    {
      label: 'Event',
      href: `/project/${ref}/database/triggers/event`,
    },
  ]

  return (
    <DatabaseLayout title="Triggers">
      {readGrant.status === 'denied' && (
        <NoPermission isFullPage resourceText="view database triggers" />
      )}
      {readGrant.status === 'error' && (
        <AlertError
          error={readGrant.error}
          subject="Failed to check database triggers permissions"
        />
      )}
      {(readGrant.status === 'loading' || readGrant.status === 'granted') && (
        <PageLayout
          title="Database Triggers"
          subtitle="Execute actions automatically when database events occur"
          navigationItems={navigationItems}
          size="large"
        >
          {children}
        </PageLayout>
      )}
    </DatabaseLayout>
  )
}
