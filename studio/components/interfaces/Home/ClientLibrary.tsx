import { FC } from 'react'
import { IconBookOpen, IconGitHub, Button, Badge } from '@supabase/ui'

interface Props {
  language: string
  officialSupport?: boolean
  releaseState?: string
  docsUrl?: string
  gitUrl: string
}

const ClientLibrary: FC<Props> = ({ language, releaseState, officialSupport, docsUrl, gitUrl }) => {
  return (
    <div className="flex space-x-6 items-start">
      <img
        src={`/img/libraries/${language.toLowerCase()}-icon.svg`}
        alt={`${language} logo`}
        width="21"
      />
      <div className="space-y-4">
        <div>
          <h5 className="text-scale-1200 text-base flex items-center gap-2">
            {language} {releaseState && <Badge color="yellow">{`Public ${releaseState}`}</Badge>}
          </h5>
          <p className="text-scale-1000 text-sm">
            {officialSupport
              ? 'This library is officially supported'
              : 'This library is community supported'}
          </p>
        </div>
        <div className="space-x-1">
          {docsUrl && (
            <a href={docsUrl} target="_blank">
              <Button icon={<IconBookOpen />} type="default">
                Docs
              </Button>
            </a>
          )}
          <a href={gitUrl} target="_blank">
            <Button icon={<IconGitHub />} type="default">
              See GitHub
            </Button>
          </a>
        </div>
      </div>
    </div>
  )
}

export default ClientLibrary
