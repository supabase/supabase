import * as Tooltip from '@radix-ui/react-tooltip'
import { LOGS_EXPLORER_DOCS_URL } from 'components/interfaces/Settings/Logs'
import Table from 'components/to-be-cleaned/Table'
import { copyToClipboard } from 'lib/helpers'
import Link from 'next/link'
import { useState } from 'react'
import { logConstants } from 'shared-data'
import {
  Button,
  IconBookOpen,
  IconCheck,
  IconClipboard,
  IconExternalLink,
  IconList,
  IconX,
  SidePanel,
  Tabs,
} from 'ui'

export interface LogsExplorerHeaderProps {
  subtitle?: string
}

const LogsExplorerHeader = ({ subtitle }: LogsExplorerHeaderProps) => {
  const [showReference, setShowReference] = useState(false)

  return (
    <div className={['flex items-center gap-8 transition-all pb-6 justify-between'].join(' ')}>
      <div className="flex items-center gap-3">
        <div
          className="flex h-6 w-6 items-center justify-center rounded border
            border-brand-600 bg-brand-300 text-brand
          "
        >
          <IconList size={14} strokeWidth={3} />
        </div>

        <h1 className="text-2xl text-foreground">Logs Explorer</h1>
        {subtitle && <span className="text-2xl text-foreground-light">{subtitle}</span>}
      </div>
      <div className="flex flex-row gap-2">
        <Button asChild type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
          <Link href={LOGS_EXPLORER_DOCS_URL}>Documentation</Link>
        </Button>

        <SidePanel
          size="large"
          header={
            <div className="flex flex-row justify-between items-center">
              <h3>Field Reference</h3>
              <Button
                type="text"
                className="px-1"
                onClick={() => setShowReference(false)}
                icon={<IconX size={18} strokeWidth={1.5} />}
              />
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
          <SidePanel.Content>
            <div className="pt-4 pb-2 space-y-1">
              <p className="text-sm">
                The following table shows all the available paths that can be queried from each
                respective source. Do note that to access nested keys, you would need to perform the
                necessary{' '}
                <Link
                  href="https://supabase.com/docs/guides/platform/logs#unnesting-arrays"
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand"
                >
                  unnesting joins
                  <IconExternalLink
                    size="tiny"
                    className="ml-1 inline -translate-y-[2px]"
                    strokeWidth={1.5}
                  />
                </Link>
              </p>
            </div>
          </SidePanel.Content>
          <SidePanel.Separator />
          <Tabs
            scrollable
            size="small"
            type="underlined"
            defaultActiveId="edge_logs"
            listClassNames="px-2"
          >
            {logConstants.schemas.map((schema) => (
              <Tabs.Panel
                key={schema.reference}
                id={schema.reference}
                label={schema.name}
                className="px-4 pb-4"
              >
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
                      <Field key={field.path} field={field} />
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

const Field = ({
  field,
}: {
  field: {
    path: string
    type: string
  }
}) => {
  const [isCopied, setIsCopied] = useState(false)

  return (
    <Table.tr>
      <Table.td
        className="font-mono text-xs !p-2 cursor-pointer hover:text-foreground transition flex items-center space-x-2"
        onClick={() =>
          copyToClipboard(field.path, () => {
            setIsCopied(true)
            setTimeout(() => setIsCopied(false), 3000)
          })
        }
      >
        <span>{field.path}</span>
        {isCopied ? (
          <Tooltip.Root delayDuration={0}>
            <Tooltip.Trigger>
              <IconCheck size={14} strokeWidth={3} className="text-brand" />
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content side="bottom">
                <Tooltip.Arrow className="radix-tooltip-arrow" />
                <div
                  className={[
                    'rounded bg-alternative py-1 px-2 leading-none shadow',
                    'border border-background',
                  ].join(' ')}
                >
                  <span className="text-xs text-foreground">Copied</span>
                </div>
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        ) : (
          <Tooltip.Root delayDuration={0}>
            <Tooltip.Trigger>
              <IconClipboard size="tiny" strokeWidth={1.5} />
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content side="bottom">
                <Tooltip.Arrow className="radix-tooltip-arrow" />
                <div
                  className={[
                    'rounded bg-alternative py-1 px-2 leading-none shadow',
                    'border border-background',
                  ].join(' ')}
                >
                  <span className="text-xs text-foreground">Copy value</span>
                </div>
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        )}
      </Table.td>
      <Table.td className="font-mono text-xs !p-2">{field.type}</Table.td>
    </Table.tr>
  )
}
