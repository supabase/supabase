import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, Button } from 'ui'
import { Info } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import Link from 'next/link'
import { useParams } from 'common'

const PublicSchemaNotEnabledAlert = () => {
  const { ref: projectRef } = useParams()

  return (
    <Alert_Shadcn_ variant="default">
      <Info className="h-4 w-4" />
      <AlertTitle_Shadcn_ className="!-mt-4">
        <ReactMarkdown>The `public` schema for this project is not exposed</ReactMarkdown>
      </AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_ className="grid gap-3 !-mt-7">
        <ReactMarkdown>
          You will not be able to query tables and views in the `public` schema via supabase-js or
          HTTP clients.
        </ReactMarkdown>

        <div className="!-mt-4 inline-block">
          <Button asChild type="default">
            <Link
              href={`/project/${projectRef}/settings/api#postgrest-config`}
              className="!no-underline !hover:bg-surface-100 !text-foreground"
            >
              View schema settings
            </Link>
          </Button>
        </div>
      </AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}

export default PublicSchemaNotEnabledAlert
