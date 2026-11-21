import { Admonition } from 'ui-patterns/Admonition'

import { FormHeader } from '@/components/ui/Forms/FormHeader'
import { DOCS_URL } from '@/lib/constants'

/** TEMPORARY: the advisors' lints do not run on a Spark project, so the page says so instead of reporting no issues. */
export const SparkLintsUnavailable = ({ title }: { title: string }) => (
  <div className="h-full flex flex-col">
    <FormHeader
      className="py-4 px-6 -mb-px!"
      title={title}
      docsUrl={`${DOCS_URL}/guides/observability/advisors`}
    />
    <div className="px-6">
      <Admonition
        type="note"
        title="Advisors are not available on Spark projects yet"
        description="The lints run catalog queries and session settings that Spark does not support, so this project has not been checked."
      />
    </div>
  </div>
)
