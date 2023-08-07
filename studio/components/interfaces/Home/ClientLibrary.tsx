import { Badge, Button, IconBookOpen, IconGitHub } from 'ui'

import { BASE_PATH } from 'lib/constants'

interface ClientLibraryProps {
  language: string
  officialSupport?: boolean
  docsUrl?: string
  gitUrl: string
  altIconName?: string
}

const ClientLibrary = ({
  language,
  officialSupport,
  docsUrl,
  gitUrl,
  altIconName,
}: ClientLibraryProps) => {
  return (
    <div className="flex items-start space-x-6">
      <img
        src={`${BASE_PATH}/img/libraries/${
          altIconName ? `${altIconName}-icon.svg` : `${language.toLowerCase()}-icon.svg`
        }`}
        alt={`${language} logo`}
        width="21"
      />
      <div className="space-y-4">
        <div>
          <h5 className="flex items-center gap-2 text-base text-scale-1200">
            {language} {!officialSupport && <Badge color="green">Community</Badge>}
          </h5>
        </div>
        <div className="flex gap-2">
          {docsUrl && (
            <a href={docsUrl} target="_blank" rel="noreferrer">
              <Button icon={<IconBookOpen />} type="default">
                Docs
              </Button>
            </a>
          )}
          <a href={gitUrl} target="_blank" rel="noreferrer">
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
