import { SupportCategories } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

import { SupportLink } from '../Support/SupportLink'

export const SuspensionNotice = ({ suspendedAt }: { suspendedAt?: string | null }) => {
  const { ref } = useParams()

  return (
    <Admonition
      layout="horizontal"
      className="mb-4"
      type="warning"
      title="Supabase has suspended Realtime for this project"
      description={
        <>
          Suspended since{' '}
          <TimestampInfo
            className="text-sm"
            labelFormat="DD MMM HH:mm:ss"
            utcTimestamp={suspendedAt ?? ''}
          />{' '}
          due to suspected unusual or excessive usage. <br />
          Contact support for details or to restore access.
        </>
      }
      actions={
        <Button asChild className="w-min">
          <SupportLink
            queryParams={{
              category: SupportCategories.DASHBOARD_BUG,
              projectRef: ref,
              subject: 'Enquiry on realtime suspension for project',
            }}
          >
            Contact support
          </SupportLink>
        </Button>
      }
    />
  )
}
