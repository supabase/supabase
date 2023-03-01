import Link from 'next/link'
import { FC } from 'react'
import { Button, IconBookOpen, IconExternalLink, IconList, IconX, SidePanel, Tabs } from 'ui'
import { LOGS_EXPLORER_DOCS_URL } from 'components/interfaces/Settings/Logs'
import { useState } from 'react'
import { Tab } from '@headlessui/react'
import { logConstants } from 'shared-data'
import Table from 'components/to-be-cleaned/Table'

interface Props {
  subtitle?: string
}

const LogsExplorerHeader: FC<Props> = ({ subtitle }) => {
  const [showReference, setShowReference] = useState(false)

  return (
    <div className={['flex items-center gap-8 transition-all pb-6 justify-between'].join(' ')}>
      <div className="flex items-center gap-3">
        <div
          className="flex h-6 w-6 items-center justify-center rounded border
            border-brand-600 bg-brand-300 text-brand-900
          "
        >
          <IconList size={14} strokeWidth={3} />
        </div>

        <h1 className="text-2xl text-scale-1200">Logs Explorer</h1>
        {subtitle && <span className="text-2xl text-scale-1000">{subtitle}</span>}
      </div>
      <div className="flex flex-row gap-4">

      <Link href={LOGS_EXPLORER_DOCS_URL}>
        <a>
          <Button type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
            Documentation
          </Button>
        </a>
      </Link>

      <SidePanel
        size="large"
        header={
          <div className="flex flex-row justify-between items-center">
            <h3>Field Reference</h3>
            <Button
              type="default"
              onClick={() => setShowReference(false)}
              icon={<IconX strokeWidth={1.5} />}
            >
              Close
            </Button>
          </div>
        }
        visible={showReference}
        cancelText="Close"
        onCancel={() => setShowReference(false)}
        hideFooter
        triggerElement={
          <Button
            type="default"
            onClick={() => setShowReference(true)}
            icon={<IconBookOpen strokeWidth={1.5} />}
          >
            Field Reference
          </Button>
        }
      >
        <Tabs scrollable size="small" type="underlined" defaultActiveId="edge_logs" listClassNames="px-2">
          {logConstants.schemas.map((schema) => (
            <Tabs.Panel id={schema.reference} label={schema.name} className="px-4">
              <Table
                head={[
                  <Table.th className="text-xs !p-2" key="path">
                    Path
                  </Table.th>,
                  <Table.th key="type" className="text-xs !p-2">
                    Type
                  </Table.th>,
                ]}
                body={schema.fields
                  .sort((a: any, b: any) => a.path - b.path)
                  .map((field) => (
                    <Table.tr key={field.path}>
                      <Table.td className="font-mono text-xs !p-2">{field.path}</Table.td>
                      <Table.td className="font-mono text-xs !p-2">{field.type}</Table.td>
                    </Table.tr>
                  ))}
              />
            </Tabs.Panel>
          ))}
        </Tabs>
      </SidePanel>
      </div>
    </div>
  )
}
export default LogsExplorerHeader
