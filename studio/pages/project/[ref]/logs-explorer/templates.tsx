import React, { useState } from 'react'
import { useRouter } from 'next/router'
import { observer, useStaticRendering } from 'mobx-react-lite'
import { IconCode, Badge, Collapsible, Button, Popover } from 'ui'
import { TEMPLATES } from 'components/interfaces/Settings/Logs'
import LogsExplorerLayout from 'components/layouts/LogsExplorerLayout/LogsExplorerLayout'
import CardButton from 'components/ui/CardButton'
import { NextPageWithLayout } from 'types'

export const LogsTemplatesPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = router.query

  return (
    <div>
      <div className="grid grid-cols-3 gap-6">
        {TEMPLATES.filter((template) => template.mode === 'custom').map((template, i) => {
          const [showPreview, setShowPreview] = useState(false)
          return (
            <CardButton
              key={i}
              title={template.label}
              icon={
                <div
                  className="duration-400 flex h-6 w-6 items-center justify-center rounded
                    bg-scale-1200
                    text-scale-100
                    transition-colors
                    group-hover:bg-brand-900
                    group-hover:text-brand-1200
                  "
                >
                  <div className="scale-100 group-hover:scale-110">
                    <IconCode size={12} strokeWidth={2} />
                  </div>
                </div>
              }
              containerHeightClassName="h-40"
              linkHref={`/project/${ref}/logs-explorer?q=${encodeURI(template.searchString)}`}
              description={template.description}
              footer={
                <div className="flex flex-row justify-end">
                  <Popover
                    onOpenChange={setShowPreview}
                    open={showPreview}
                    className="rounded-lg bg-scale-100"
                    size="content"
                    overlay={
                      <pre className="whitespace-pre-line break-words rounded-lg bg-scale-100 p-4 text-sm">
                        {template.searchString}
                      </pre>
                    }
                  >
                    <Button
                      type="default"
                      as="span"
                      onClick={(e) => {
                        e.preventDefault()
                        setShowPreview(!showPreview)
                      }}
                    >
                      Preview
                    </Button>
                  </Popover>
                </div>
              }
            />
          )
        })}
      </div>
    </div>
  )
}

LogsTemplatesPage.getLayout = (page) => <LogsExplorerLayout>{page}</LogsExplorerLayout>

export default observer(LogsTemplatesPage)
