import { HeaderBanner } from 'components/interfaces/Organization/resource-banner'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { WarningIcon } from 'ui'

const IncidentBanner = () => {
  return (
    <Link href="https://status.supabase.com" target="_blank" rel="noreferrer">
      {/* <div className="px-2 mx-auto w-full xl:max-w-[700px] items-center flex flex-row gap-3">
        <WarningIcon className="flex-shrink-0 bg-brand text-brand-200" />
        <span className="text-sm">
          We are currently investigating a technical issue, follow status.supabase.com for updates
        </span>
        <ExternalLink size={14} strokeWidth={1} />
      </div> */}
      <HeaderBanner
        type="incident"
        title="We are currently investigating a technical issue"
        message="follow status.supabase.com for updates"
      />
    </Link>
  )
}

export default IncidentBanner
