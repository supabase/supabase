import React, { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useParams } from 'common'
import { IconCode, Button, Popover } from 'ui'
import { LogTemplate, TEMPLATES } from 'components/interfaces/Settings/Logs'
import LogsLayout from 'components/layouts/LogsLayout/LogsLayout'
import CardButton from 'components/ui/CardButton'
import { NextPageWithLayout } from 'types'
import LogsExplorerHeader from 'components/ui/Logs/LogsExplorerHeader'

export const LogsTemplatesPage: NextPageWithLayout = () => {
  const { ref: projectRef } = useParams()

  return (
    <div className="mx-auto h-full w-full px-5 py-6">
      <LogsExplorerHeader subtitle="Templates" />
      <div className="grid grid-cols-3 gap-6 mt-4">
        {TEMPLATES.sort((a, b) => a.label!.localeCompare(b.label!))
          .filter((template) => template.mode === 'custom')
          .map((template, i) => {
            return <Template key={i} projectRef={projectRef} template={template} />
          })}
      </div>
    </div>
  )
}

LogsTemplatesPage.getLayout = (page) => <LogsLayout>{page}</LogsLayout>

export default observer(LogsTemplatesPage)

const Template = ({ projectRef, template }: { projectRef?: string; template: LogTemplate }) => {
  const [showPreview, setShowPreview] = useState(false)

  return (
    <CardButton
      title={template.label}
      icon={
        <div
          className="duration-400 flex h-6 w-6 items-center justify-center rounded
          bg-foreground
          text-background
          transition-colors
          group-hover:bg-brand
          group-hover:text-brand-600
        "
        >
          <div className="scale-100 group-hover:scale-110">
            <IconCode size={12} strokeWidth={2} />
          </div>
        </div>
      }
      className="h-40"
      linkHref={`/project/${projectRef}/logs/explorer?q=${encodeURI(template.searchString)}`}
      description={template.description}
      footer={
        <div className="flex flex-row justify-end">
          <Popover
            onOpenChange={setShowPreview}
            open={showPreview}
            className="rounded-lg bg-alternative"
            size="content"
            overlay={
              <pre className="whitespace-pre-line break-words rounded-lg bg-alternative p-4 text-sm">
                {template.searchString}
              </pre>
            }
          >
            <Button
              asChild
              type="default"
              onClick={(e) => {
                e.preventDefault()
                setShowPreview(!showPreview)
              }}
            >
              <span>Preview</span>
            </Button>
          </Popover>
        </div>
      }
    />
  )
}
