import { Admonition } from 'ui-patterns/admonition'

interface NoPermissionProps {
  resourceText: string
  isFullPage?: boolean
}

const NoPermissionMessage = ({ resourceText }: { resourceText: string }) => (
  <Admonition
    type="warning"
    title={`You need additional permissions to ${resourceText}`}
    description="Contact your organization owner or administrator for assistance."
  />
)

export const NoPermission = ({ resourceText, isFullPage = false }: NoPermissionProps) => {
  if (isFullPage) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="max-w-lg">
          <NoPermissionMessage resourceText={resourceText} />
        </div>
      </div>
    )
  } else {
    return <NoPermissionMessage resourceText={resourceText} />
  }
}

export default NoPermission
