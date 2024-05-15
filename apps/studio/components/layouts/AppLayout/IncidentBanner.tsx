import { ExternalLink } from 'lucide-react'
import Link from 'next/link'

const IncidentBanner = () => {
  return (
    <Link href="https://status.supabase.com" target="_blank" rel="noreferrer">
      <div className="flex cursor-pointer items-center justify-center space-x-2 bg-green-900 py-3 transition hover:bg-green-1000 text-foreground">
        <p className="text-sm font-medium">
          We are currently investigating a technical issue, follow status.supabase.com for updates
        </p>
        <ExternalLink size={16} strokeWidth={2} />
      </div>
    </Link>
  )
}

export default IncidentBanner
