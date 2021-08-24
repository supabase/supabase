import { Typography, IconBookOpen, IconGitHub, Button, Badge } from '@supabase/ui'
type ClientLibraryProps = {
  language: string
  officalSupport?: boolean
  releaseState?: string
  docsUrl?: string
  gitUrl: string
}

const iconUrl = 'https://app.supabase.io/icons/libraries/'
export default function ClientLibrary({
  language,
  releaseState,
  officalSupport,
  docsUrl,
  gitUrl,
}: ClientLibraryProps) {
  return (
    <div className="flex space-x-6 items-start">
      <img
        src={`${iconUrl}/${language.toLowerCase()}-icon.svg`}
        alt={`${language} logo`}
        width="21"
      />
      <div className="space-y-4">
        <div>
          <Typography.Title level={5}>
            {language} {releaseState && <Badge color="yellow">{`Public ${releaseState}`}</Badge>}
          </Typography.Title>
          <Typography.Text>
            {officalSupport
              ? 'This library is officially supported'
              : 'This library is community supported'}
          </Typography.Text>
        </div>
        <div className="space-x-1">
          {docsUrl && (
            <a href={docsUrl} target="_blank">
              <Button icon={<IconBookOpen />} type="outline">
                Docs
              </Button>
            </a>
          )}
          <a href={gitUrl} target="_blank">
            <Button icon={<IconGitHub />} type="outline">
              See GitHub
            </Button>
          </a>
        </div>
      </div>
    </div>
  )
}
