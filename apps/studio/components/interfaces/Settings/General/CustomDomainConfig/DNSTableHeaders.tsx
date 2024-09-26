import { Loader2 } from 'lucide-react'

export type DNSTableHeaderProps = {
  display: string
}

export const DNSTableHeaders = ({ display }: DNSTableHeaderProps) => {
  // Display the DNS table headers if we have something to show
  if (display !== '') {
    return (
      <div className="flex gap-4">
        <div className="w-[50px]">
          <p className="text-foreground-light text-sm">Type</p>
        </div>
        <div className="text-sm grid gap-2 md:grid md:grid-cols-12 md:gap-x-4 input-mono flex-1">
          <div className="flex flex-row space-x-2 justify-between col-span-12">
            <label className="block text-foreground-light text-sm break-all">Name</label>
          </div>
        </div>
        <div className="text-sm grid gap-2 md:grid md:grid-cols-12 md:gap-x-4 input-mono flex-1">
          <div className="flex flex-row space-x-2 justify-between col-span-12">
            <label className="block text-foreground-light text-sm break-all">Content</label>
          </div>
        </div>
      </div>
    )
  }

  // If we have not detected SSL TXT records ask the user to (re)validate
  return (
    <div className="flex items-center gap-2">
      <Loader2 size={14} className="animate-spin" />
      <p className="text-sm text-foreground-light">
        Validating custom domain and TLS configuration...
      </p>
    </div>
  )
}
