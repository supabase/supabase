import { AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, Button } from 'ui'

export const ProjectPausedAlert = ({
  title = 'Project is paused',
  description = 'Restore this project to continue',
  projectRef,
}: {
  title?: string
  description?: string
  projectRef?: string
}) => {
  return (
    <Alert_Shadcn_ variant="warning">
      <AlertCircle />
      <AlertTitle_Shadcn_>{title}</AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_>{description}</AlertDescription_Shadcn_>
      {projectRef && (
        <div className="mt-3 flex items-center space-x-2">
          <Button asChild type="default">
            <Link href={`/project/${projectRef}`}>Restore project</Link>
          </Button>
        </div>
      )}
    </Alert_Shadcn_>
  )
}
