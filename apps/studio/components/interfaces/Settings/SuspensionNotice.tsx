import { useParams } from 'common'
import { Admonition } from 'ui-patterns/Admonition'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

import { ContactSupportButton } from '@/components/ui/AlertError'

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
        <ContactSupportButton
          projectRef={ref}
          subject="Enquiry on realtime suspension for project"
        />
      }
    />
  )
}
