import { useRoleImpersonationStateSnapshot } from 'state/role-impersonation-state'
import { AlertTriangle } from 'lucide-react'
import { Button } from 'ui'

export const TransactionBanner = ({ sticky = false }: { sticky?: boolean }) => {
  const { hasTransaction, setHasTransaction } = useRoleImpersonationStateSnapshot()

  if (!hasTransaction) {
    return null
  }

  return (
    <div
      className={`flex items-center gap-x-3 bg-warning py-2 px-3 text-warning-100 ${
        sticky ? 'sticky top-0 z-10' : ''
      }`}
    >
      <p className="text-xs">
        You are in test mode. Any data changes you make will be rolled back.
      </p>
      <Button
        type="text"
        size="tiny"
        className="bg-warning-400 text-xs"
        onClick={() => setHasTransaction(false)}
      >
        Switch off test mode
      </Button>
    </div>
  )
}
