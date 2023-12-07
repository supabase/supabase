import { useParams } from 'common'
import { Markdown } from 'components/interfaces/Markdown'
import { BASE_PATH } from 'lib/constants'
import Image from 'next/image'

const RLSAIAssistantPreview = () => {
  const { ref } = useParams()

  return (
    <div className="space-y-2">
      <div className="mb-4 flex flex-col gap-y-2">
        <Markdown
          className="text-foreground-light max-w-full"
          content={`[Postgres Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) (RLS) is a feature of Postgres that allows you to control which users are allowed to perform operations on specific rows within tables, views, and functions.`}
        />
        <Markdown
          className="text-foreground-light max-w-full"
          content={`Let our AI Assistant handle the SQL while you focus on building the rules for your policies.`}
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
              content={`Replace the existing wizard-like UI for creating/updating RLS policies [here](/project/${ref}/auth/policies). Create policies in code with Supabase Assistant`}
            />
          </li>
          <li>
            <Markdown
              className="text-foreground-light"
              content={`Supabase Assistant will iteratively generate SQL from your natural language prompts`}
            />
          </li>
        </ul>
      </div>
    </div>
  )
}

export default RLSAIAssistantPreview
