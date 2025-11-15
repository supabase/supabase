import { useParams } from 'common'
import { CodeIcon } from 'lucide-react'
import { useState } from 'react'

import { TEMPLATES } from 'components/interfaces/Settings/Logs/Logs.constants'
import type { LogTemplate } from 'components/interfaces/Settings/Logs/Logs.types'
import DefaultLayout from 'components/layouts/DefaultLayout'
import LogsLayout from 'components/layouts/LogsLayout/LogsLayout'
import CardButton from 'components/ui/CardButton'
import LogsExplorerHeader from 'components/ui/Logs/LogsExplorerHeader'
import { UnknownInterface } from 'components/ui/UnknownInterface'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import type { NextPageWithLayout } from 'types'
import { Button, Popover, PopoverContent, PopoverTrigger, cn } from 'ui'

export const LogsTemplatesPage: NextPageWithLayout = () => {
  const { ref: projectRef } = useParams()
  const { logsTemplates: isTemplatesEnabled, logsShowMetadataIpTemplate: showMetadataIpTemplate } =
    useIsFeatureEnabled(['logs:templates', 'logs:show_metadata_ip_template'])

  if (!isTemplatesEnabled) {
    return <UnknownInterface urlBack={`/project/${projectRef}/logs/explorer`} />
  }

  const allTemplates = showMetadataIpTemplate
    ? TEMPLATES
    : TEMPLATES.filter((template) => template.label !== 'Metadata IP')

  return (
    <div className="mx-auto h-full w-full px-5 py-6">
      <LogsExplorerHeader subtitle="Templates" />
      <div className="grid lg:grid-cols-3 gap-6 mt-4 pb-24">
        {allTemplates
          .sort((a, b) => a.label!.localeCompare(b.label!))
          .filter((template) => template.mode === 'custom')
          .map((template, i) => {
            return <Template key={i} projectRef={projectRef} template={template} />
          })}
      </div>
    </div>
  )
}

LogsTemplatesPage.getLayout = (page) => (
  <DefaultLayout>
    <LogsLayout>{page}</LogsLayout>
  </DefaultLayout>
)

export default LogsTemplatesPage

const Template = ({ projectRef, template }: { projectRef?: string; template: LogTemplate }) => {
  const [showPreview, setShowPreview] = useState(false)

  return (
    <CardButton
      title={template.label}
      icon={
        <div
          className={cn(
            'duration-400 flex h-6 w-6 items-center justify-center rounded transition-colors',
            'border bg-background-200',
            'group-hover:bg-brand-300 group-hover:text-brand-600 group-hover:border-brand-500',
            'dark:border-background-selection dark:bg-background-200 dark:text-foreground',
            'dark:group-hover:border-brand-600 dark:group-hover:bg-brand-300 dark:group-hover:text-brand-600'
          )}
        >
          <div className="scale-100 group-hover:scale-110">
            <CodeIcon size={12} strokeWidth={2} />
          </div>
        </div>
      }
      className="h-44"
      linkHref={`/project/${projectRef}/logs/explorer?q=${encodeURI(template.searchString)}`}
      description={template.description}
      footer={
        <div className="flex flex-row justify-end">
          <Popover open={showPreview} onOpenChange={setShowPreview}>
            <PopoverTrigger asChild>
              <Button
                type="default"
                onClick={(e) => {
                  e.preventDefault()
                  setShowPreview(!showPreview)
                }}
              >
                Preview
              </Button>
            </PopoverTrigger>

            <PopoverContent align="start">
              <pre className="whitespace-pre-line break-words rounded-lg bg-alternative p-4 text-sm">
                {template.searchString}
              </pre>
            </PopoverContent>
          </Popover>
        </div>
      }
    />
  )
}
