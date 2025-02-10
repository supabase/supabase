import Link from 'next/link'

import { useParams } from 'common'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns'

const PublicSchemaNotEnabledAlert = () => {
  const { ref: projectRef } = useParams()

  return (
    <Admonition type="default">
      <p className="!mt-0 !mb-1.5">The public schema for this project is not exposed</p>
      <p className="!mt-0 !mb-1.5 text-foreground-light">
        You will not be able to query tables and views in the public schema via supabase-js or HTTP
        clients. Configure this behavior in your project's Data API settings.
      </p>
      <Button asChild type="default" className="mt-1">
        <Link
          href={`/project/${projectRef}/settings/api#postgrest-config`}
          className="!no-underline"
        >
          View API settings
        </Link>
      </Button>
    </Admonition>
  )
}

export default PublicSchemaNotEnabledAlert
