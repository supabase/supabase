import React, { useState } from 'react'
import { useRouter } from 'next/router'
import { observer, useStaticRendering } from 'mobx-react-lite'
import { IconCode, Badge, Collapsible, Button, Popover } from '@supabase/ui'
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
        {TEMPLATES.filter((template) => template.mode === 'custom').map((template) => {
          const [showPreview, setShowPreview] = useState(false)
          return (
            <CardButton
              title={template.label}
              icon={
                <div
                  className="text-scale-100 bg-scale-1200 duration-400 group-hover:bg-brand-900 group-hover:text-brand-1200 flex h-6
                    w-6
                    items-center
                    justify-center
                    rounded
                    transition-colors
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
                    className="bg-scale-100 rounded-lg"
                    size="content"
                    overlay={
                      <pre className="bg-scale-100 whitespace-pre-line break-words rounded-lg p-4 text-sm">
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
