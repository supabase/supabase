import Link from 'next/link'
import { IconExternalLink } from 'ui'

const IncidentBanner = () => {
  return (
    <Link href="https://status.supabase.com">
      <a target="_blank" rel="noreferrer">
        <div className="flex cursor-pointer items-center justify-center space-x-2 bg-green-900 py-3 text-scale-400 transition hover:bg-green-1000 dark:text-foreground">
          <p className="text-sm font-medium">
            We are currently investigating a technical issue, follow status.supabase.com for updates
          </p>
          <IconExternalLink size={16} strokeWidth={2} />
        </div>
      </a>
    </Link>
  )
}

export default IncidentBanner
