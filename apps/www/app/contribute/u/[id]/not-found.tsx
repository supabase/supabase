import { BackToThreadsLink } from '~/components/Contribute/BackToThreadsLink'

export default function NotFound() {
  return (
    <div className="border border-border rounded-lg p-8 bg-surface-200 text-center">
      <h2 className="text-xl font-semibold text-foreground mb-2">User Not Found</h2>
      <p className="text-foreground-light mb-6">
        This user hasn’t created any threads or replies yet, or doesn’t exist.
      </p>
      <BackToThreadsLink />
    </div>
  )
}
