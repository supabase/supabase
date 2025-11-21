import Image from 'next/image'

import { useParams } from 'common'
import { InlineLink } from 'components/ui/InlineLink'
import { BASE_PATH } from 'lib/constants'

export const SecurityNotificationsPreview = () => {
  const { ref } = useParams()

  return (
    <div className="text-sm text-foreground-light">
      <Image
        alt="Security notifications preview"
        src={`${BASE_PATH}/img/previews/security-notifications-preview.png`}
        width={1296}
        height={900}
        className="rounded border mb-4"
      />
      <div className="space-y-2 !mt-4">
        <p className=" mb-4">
          Try out our expanded set of{' '}
          <InlineLink href={`/project/${ref ?? '_'}/auth/templates`}>email templates</InlineLink>{' '}
          with support for security-related notifications.
        </p>
        <p className="text-foreground">Enabling this preview will:</p>
        <ul className="list-disc pl-6  space-y-1">
          <li>Add a dedicated sidebar section for contact methods like email and SMS</li>
          <li>Add new email templates for security-related notifications</li>
          <li>Move each (existing and new) template into its own dynamic route</li>
        </ul>
        <p>
          These changes are necessary to support incoming security-related notification templates.
          Given that the list of our email templates is doubling in size, this change requires some
          wider interface changes. Ones that we think make for a clearer experience overall.
        </p>
      </div>
    </div>
  )
}
