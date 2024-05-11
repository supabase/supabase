import { useParams } from 'common'
import { Markdown } from 'components/interfaces/Markdown'
import { BASE_PATH } from 'lib/constants'
import Image from 'next/image'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, IconAlertCircle } from 'ui'

const CLSPreview = () => {
  const { ref } = useParams()

  return (
    <div className="flex flex-col gap-2">
      <div className="mb-4 flex flex-col gap-y-2">
        <Markdown
          className="text-foreground-light max-w-full"
          content={`[Postgres Column-Level Privileges](https://supabase.com/docs/guides/auth/column-level-security) is a feature of Postgres that allows you to grant or revoke privileges on tables and columns based on user roles.`}
        />
        <Markdown
          className="text-foreground-light max-w-full"
          content={`This is an advanced feature and should be used with caution. Unless you have a very specific use case, we recommend just using [Row-Level Security](https://supabase.com/docs/guides/auth/row-level-security).`}
        />
        <Alert_Shadcn_ variant="warning" className="mt-2">
          <IconAlertCircle strokeWidth={2} />
          <AlertTitle_Shadcn_>
            Changes to column privileges will not be reflected in migrations when running{' '}
            <code className="text-xs">supabase db diff</code>.
          </AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_>
            Column privileges are not supported in the current version of the Supabase CLI.
            <br />
            You will need to manually apply these changes to your database.
          </AlertDescription_Shadcn_>
        </Alert_Shadcn_>
      </div>
      <Image
        src={`${BASE_PATH}/img/previews/cls-preview.png`}
        width={1860}
        height={970}
        alt="api-docs-side-panel-preview"
        className="rounded border"
      />
      <div className="space-y-2 !mt-4">
        <p className="text-sm">Enabling this preview will:</p>
        <ul className="list-disc pl-6 text-sm text-foreground-light space-y-1">
          <li>
            <Markdown
              className="text-foreground-light"
              content={`Grant access to a new UI for granting and/or revoking column-level privileges [here](/project/${ref}/database/column-privileges).`}
            />
          </li>
        </ul>
      </div>
    </div>
  )
}

export default CLSPreview
