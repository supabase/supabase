import Link from 'next/link'

import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

export const UpgradeDatabaseAlert = () => {
  const project = useSelectedProject()

  return (
    <Admonition
      type="warning"
      className="mt-4"
      title="Database Upgrade Needed"
      childProps={{ description: { className: 'flex flex-col gap-y-2' } }}
    >
      <div className="prose text-sm max-w-full">
        <p>
          This integration requires the <code>pgmq</code> extension which is not available on this
          version of Postgres. The extension is available on version 15.6.1.143 and higher.
        </p>
      </div>
      <Button color="primary" className="w-fit">
        <Link href={`/project/${project?.ref}/settings/infrastructure`}>Upgrade database</Link>
      </Button>
    </Admonition>
  )
}
