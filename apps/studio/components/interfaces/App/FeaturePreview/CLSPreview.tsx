import { Markdown } from 'components/interfaces/Markdown'
import { BASE_PATH } from 'lib/constants'
import Image from 'next/image'

const CLSPreview = () => {
  return (
    <div className="flex flex-col gap-2">
      <div className="mb-4 flex flex-col gap-y-2">
        <Markdown
          className="text-foreground-light max-w-full"
          content={`[Postgres Column-Level Privileges](https://supabase.com/docs/guides/guides/auth/column-level-security) is a feature of Postgres that allows you to grant or revoke privileges on tables and columns based on user roles.`}
        />
        <Markdown
          className="text-foreground-light max-w-full"
          content={`This is an advanced feature and should be used with caution.`}
        />
      </div>
      <Image
        src={`${BASE_PATH}/img/previews/rls-ai-assistant-preview.png`}
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
              content={`Grant access to a new UI for granting and/or revoking column-level privileges.`}
            />
          </li>
        </ul>
      </div>
    </div>
  )
}

export default CLSPreview
