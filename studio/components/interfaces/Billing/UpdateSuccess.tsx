import { FC } from 'react'
import { useRouter } from 'next/router'
import { Button, IconCheckCircle } from '@supabase/ui'

interface Props {
  title: string
  message: string
  projectRef: string
}

const UpdateSuccess: FC<Props> = ({ title, message, projectRef }) => {
  const router = useRouter()

  return (
    <div
      style={{ height: 'calc(100vh - 5rem - 49.5px)' }}
      className="space-y-4 flex flex-col justify-center max-w-xl mx-auto"
    >
      <div className="flex items-center space-x-4">
        <IconCheckCircle strokeWidth={2} />
        <h3 className="text-xl">{title}</h3>
      </div>
      <p className="text-sm text-scale-1100">{message}</p>
      <div />
      <div className="flex items-center space-x-4">
        <Button onClick={() => router.push(`/project/${projectRef}`)}>Back to dashboard</Button>
        <Button
          onClick={() => router.push(`/project/${projectRef}/settings/billing/update`)}
          type="default"
        >
          Back to billing
        </Button>
      </div>
    </div>
  )
}

export default UpdateSuccess
