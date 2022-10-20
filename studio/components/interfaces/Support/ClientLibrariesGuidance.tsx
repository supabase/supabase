import Link from 'next/link'
import { FC } from 'react'
import { Button, IconExternalLink } from 'ui'
import { GITHUB_LINKS } from './Support.constants'

interface Props {}

const ClientLibrariesGuidance: FC<Props> = ({}) => {
  return (
    <div className="px-6 space-y-4">
      <div className="space-y-2">
        <p>Github Issues</p>
        <p className="text-sm text-scale-1100">
          Have a general issue or bug that you've found? Do submit it in our Github issues!
        </p>
      </div>
      <div className="grid grid-cols-3 gap-4 content-start">
        {GITHUB_LINKS.map((repo) => (
          <div
            key={repo.name}
            className="rounded border border-scale-600 bg-scale-300 space-y-3 px-4 py-3"
          >
            <div className="space-y-1">
              <p className="text-sm">{repo.name}</p>
              <p className="text-sm text-scale-1100">{repo.description}</p>
            </div>
            <div>
              <Link href={repo.url}>
                <a target="_blank">
                  <Button type="default" icon={<IconExternalLink size={14} strokeWidth={1.5} />}>
                    View Github issues
                  </Button>
                </a>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ClientLibrariesGuidance
