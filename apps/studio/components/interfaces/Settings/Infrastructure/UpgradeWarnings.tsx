import { Alert_Shadcn_, AlertDescription_Shadcn_, AlertTitle_Shadcn_, Button } from 'ui'

export const ReadReplicasWarning = ({ latestPgVersion }: { latestPgVersion: string }) => {
  return (
    <Alert_Shadcn_>
      <AlertTitle_Shadcn_>
        A new version of Postgres is available for your project
      </AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_>
        You will need to remove all read replicas prior to upgrading your Postgres version to the
        latest available ({latestPgVersion}).
      </AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}

export const DatabaseExtensionsWarning = ({
  extensions,
  potentialBreakingChanges,
}: {
  extensions: string[]
  potentialBreakingChanges?: string[]
}) => {
  return (
    <Alert_Shadcn_
      variant="warning"
      title="A new version of Postgres is available for your project"
    >
      <AlertTitle_Shadcn_>A new version of Postgres is available</AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_ className="flex flex-col gap-3">
        <div>
          <p className="mb-1">You'll need to remove the following extensions before upgrading:</p>

          <ul className="pl-4">
            {extensions.map((obj) => (
              <li className="list-disc" key={obj}>
                {obj}
              </li>
            ))}
          </ul>
        </div>
        <p>
          {potentialBreakingChanges?.includes('pg17_upgrade_unsupported_extensions')
            ? 'These extensions are not supported in newer versions of Supabase Postgres. If you are not using them, it is safe to remove them.'
            : 'Check the docs for which ones might need to be removed.'}
        </p>
        <div>
          <Button size="tiny" type="default" asChild>
            <a
              target="_blank"
              rel="noreferrer"
              href="https://supabase.com/docs/guides/platform/upgrading#extensions"
            >
              View docs
            </a>
          </Button>
        </div>
      </AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}

export const ObjectsToBeDroppedWarning = ({
  objectsToBeDropped,
}: {
  objectsToBeDropped: string[]
}) => {
  return (
    <Alert_Shadcn_
      variant="warning"
      title="A new version of Postgres is available for your project"
    >
      <AlertTitle_Shadcn_>A new version of Postgres is available</AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_ className="flex flex-col gap-3">
        <div>
          <p className="mb-1">You'll need to remove the following objects before upgrading:</p>

          <ul className="pl-4">
            {objectsToBeDropped.map((obj) => (
              <li className="list-disc" key={obj}>
                {obj}
              </li>
            ))}
          </ul>
        </div>
        <p>Check the docs for which objects need to be removed.</p>
        <div>
          <Button size="tiny" type="default" asChild>
            <a
              href="https://supabase.com/docs/guides/platform/upgrading#extensions"
              target="_blank"
              rel="noreferrer"
            >
              View docs
            </a>
          </Button>
        </div>
      </AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}

export const UnsupportedExtensionsWarning = ({
  unsupportedExtensions,
}: {
  unsupportedExtensions: string[]
}) => {
  return (
    <Alert_Shadcn_
      variant="warning"
      title="A new version of Postgres is available for your project"
    >
      <AlertTitle_Shadcn_>A new version of Postgres is available</AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_ className="flex flex-col gap-3">
        <div>
          <p className="mb-1">You'll need to remove the following extensions before upgrading:</p>

          <ul className="pl-4">
            {unsupportedExtensions.map((obj: string) => (
              <li className="list-disc" key={obj}>
                {obj}
              </li>
            ))}
          </ul>
        </div>
        <p>
          These extensions are not supported in newer versions of Supabase Postgres. If you are not
          using them, it is safe to remove them.
        </p>
        <div>
          <Button size="tiny" type="default" asChild>
            <a
              href="https://supabase.com/docs/guides/platform/upgrading#extensions"
              target="_blank"
              rel="noreferrer"
            >
              View docs
            </a>
          </Button>
        </div>
      </AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}

export const UserDefinedObjectsInInternalSchemasWarning = ({ objects }: { objects: string[] }) => {
  return (
    <Alert_Shadcn_
      variant="warning"
      title="A new version of Postgres is available for your project"
    >
      <AlertTitle_Shadcn_>A new version of Postgres is available</AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_ className="flex flex-col gap-3">
        <div>
          <p className="mb-1">
            You'll need to move these objects out of auth/realtime/storage schemas before upgrading:
          </p>

          <ul className="pl-4">
            {objects.map((obj: string) => (
              <li className="list-disc" key={obj}>
                {obj}
              </li>
            ))}
          </ul>
        </div>
        <p>
          These schemas are Supabase-managed and creating custom objects in them is no longer
          supported. Check the changelog to see how to move them to your own schemas.
        </p>
        <div>
          <Button size="tiny" type="default" asChild>
            <a
              href="https://github.com/orgs/supabase/discussions/34270"
              target="_blank"
              rel="noreferrer"
            >
              View changelog
            </a>
          </Button>
        </div>
      </AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}
