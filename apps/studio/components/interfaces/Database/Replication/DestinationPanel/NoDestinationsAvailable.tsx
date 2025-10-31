import { DatabaseZap } from 'lucide-react'

export const NoDestinationsAvailable = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 py-16 text-center">
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-surface-300 mb-6">
        <DatabaseZap className="w-10 h-10 text-foreground-light" strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-medium text-foreground mb-3">No destinations available</h3>
      <p className="text-sm text-foreground-light max-w-md leading-relaxed">
        Replication destinations are not currently enabled for this project. Contact support to
        enable real-time data replication to external platforms.
      </p>
    </div>
  )
}
