import { InlineLink } from 'components/ui/InlineLink'
import { BASE_PATH } from 'lib/constants'
import Image from 'next/image'

export const SystemStatusBadgePreview = () => {
  return (
    <div className="space-y-2">
      <p className="text-foreground-light text-sm mb-4">
        Stay informed about platform health with a live status indicator in your dashboard header.
        The badge displays real-time information about ongoing incidents, scheduled maintenance, and
        operational status directly from our{' '}
        <InlineLink href="https://status.supabase.com">status page</InlineLink>.
      </p>
      <Image
        src={`${BASE_PATH}/img/previews/system-status-badge-preview.png`}
        width={1860}
        height={970}
        alt="system-status-badge-preview"
        className="rounded border"
      />
      <div className="space-y-2 !mt-4">
        <p className="text-sm">Enabling this preview will:</p>
        <ul className="list-disc pl-6 text-sm text-foreground-light space-y-1">
          <li>Add a status badge to your dashboard header showing platform health</li>
          <li>Display detailed incident and maintenance information on hover</li>
          <li>Provide quick access to the full status page for updates</li>
        </ul>
      </div>
    </div>
  )
}
