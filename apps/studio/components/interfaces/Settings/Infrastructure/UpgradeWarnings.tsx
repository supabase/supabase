import { useParams } from 'common'
import Link from 'next/link'
import { InlineLink } from 'components/ui/InlineLink'
import { Alert_Shadcn_, AlertDescription_Shadcn_, AlertTitle_Shadcn_, Badge, Button } from 'ui'

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
          <p className="mb-1">The following objects have to be removed before upgrading:</p>

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
  const { ref } = useParams()

  return (
    <Alert_Shadcn_ title="A newer version of Postgres is available">
      <AlertTitle_Shadcn_>A newer version of Postgres is available</AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_ className="flex flex-col gap-3">
        <>
          <p className="mb-1">
            The following extensions are not supported in newer versions of Postgres and must be
            removed before you can upgrade.{' '}
            <InlineLink
              href="https://supabase.com/docs/guides/platform/upgrading#upgrading-to-postgres-17"
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn more
            </InlineLink>
            .
          </p>

          <ul className="border-t border-border-muted flex flex-col divide-y divide-border-muted">
            {unsupportedExtensions.map((obj: string) => (
              <li className="py-3 last:pb-0 flex flex-row justify-between gap-2" key={obj}>
                <div className="flex flex-row gap-2 items-center flex-1 min-w-0">
                  <p className="overflow-hidden text-ellipsis whitespace-nowrap min-w-0">{obj}</p>
                  <Badge variant="warning" size="small" className="flex-shrink-0">
                    Deprecated
                  </Badge>
                </div>
                <Button size="tiny" type="default" asChild>
                  <Link href={`/project/${ref}/database/extensions?filter=${obj}`}>Manage</Link>
                </Button>
              </li>
            ))}
          </ul>
        </>
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
