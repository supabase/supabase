import { DatabaseZap } from 'lucide-react'

export const NoDestinationsAvailable = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 py-16 text-center">
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-surface-300 mb-5">
        <DatabaseZap size={26} className="text-foreground-light" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">No destinations available</h3>
      <p className="text-sm text-foreground-light max-w-lg">
        Replication destinations are not currently enabled for this project. Contact support to
        enable real-time replication to external platforms.
      </p>
    </div>
  )
}
