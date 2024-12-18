import { ExternalLink } from 'lucide-react'
import Link from 'next/link'

const IncidentBanner = () => {
  return (
    <Link href="https://status.supabase.com" target="_blank" rel="noreferrer">
      <div className="flex cursor-pointer items-center justify-center space-x-2 bg-brand-400 mx-2 border-l border-b border-r border-brand-500 py-1 transition hover:bg-green-1000 text-foreground rounded-b-[7px]">
        <p className="text-sm">
          We are currently investigating a technical issue, follow status.supabase.com for updates
        </p>
        <ExternalLink size={14} strokeWidth={1} />
      </div>
    </Link>
  )
}

export default IncidentBanner
