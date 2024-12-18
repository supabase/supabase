import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { WarningIcon } from 'ui'

const IncidentBanner = () => {
  return (
    <Link
      href="https://status.supabase.com"
      target="_blank"
      rel="noreferrer"
      className="flex items-center cursor-pointer justify-center space-x-2 bg-brand-400 mx-2 border-l border-b border-r border-brand-500 py-1 transition hover:bg-brand-300 text-foreground last:rounded-b-[7px]"
    >
      <div className="px-2 mx-auto w-full xl:max-w-[700px] items-center flex flex-row gap-3">
        <WarningIcon className="flex-shrink-0 bg-brand text-brand-200" />
        <span className="text-sm">
          We are currently investigating a technical issue, follow status.supabase.com for updates
        </span>
        <ExternalLink size={14} strokeWidth={1} />
      </div>
    </Link>
  )
}

export default IncidentBanner
