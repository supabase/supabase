import { FlaskConical } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from 'ui'

import { WORKER_SIZES } from './Workers.constants'
import { useWorkerDeployMutation } from '@/data/workers/worker-deploy-mutation'
import { IS_STAGING_OR_LOCAL } from '@/lib/constants'

interface WorkerTestDeployButtonProps {
  projectRef: string
}

const testWorkerName = () => `test-worker-${Date.now().toString(36)}`

// Staff-only affordance for exercising the deploy path (and the log pipeline behind it)
// without the create dialog. Never rendered on production — see IS_STAGING_OR_LOCAL.
export const WorkerTestDeployButton = ({ projectRef }: WorkerTestDeployButtonProps) => {
  const { mutate: deployWorker, isPending } = useWorkerDeployMutation({
    onSuccess: (worker) => toast.success(`Deploying ${worker.name}`),
  })

  if (!IS_STAGING_OR_LOCAL) return null

  return (
    <Button
      variant="default"
      icon={<FlaskConical />}
      loading={isPending}
      onClick={() =>
        deployWorker({
          projectRef,
          name: testWorkerName(),
          size: WORKER_SIZES[0],
          access: 'public',
          instances: 1,
        })
      }
    >
      Deploy test worker
    </Button>
  )
}
