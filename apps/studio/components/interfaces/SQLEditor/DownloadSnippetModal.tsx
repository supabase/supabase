import type { ModalProps } from '@ui/components/Modal/Modal'
import { snakeCase } from 'lodash'
import Link from 'next/link'
import { useState } from 'react'
import { Button, CodeBlock, IconExternalLink, Modal, Tabs } from 'ui'

import TwoOptionToggle from 'components/ui/TwoOptionToggle'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'
import { Markdown } from '../Markdown'
import {
  generateFileCliCommand,
  generateMigrationCliCommand,
  generateSeedCliCommand,
} from './SQLEditor.utils'

export interface DownloadSnippetModalProps extends ModalProps {
  id: string
}

const DownloadSnippetModal = ({ id, ...props }: DownloadSnippetModalProps) => {
  const snap = useSqlEditorStateSnapshot()
  const snippet = snap.snippets[id].snippet
  const migrationName = snakeCase(snippet.name)

  const [selectedView, setSelectedView] = useState<'CLI' | 'NPM'>('CLI')

  const SNIPPETS = [
    {
      id: 'migration',
      label: 'Migration',
      title: 'Download as migration',
      description: `Download the snippet in a new migration named \`${migrationName}\``,
      cli: generateMigrationCliCommand(id, migrationName),
      npm: generateMigrationCliCommand(id, migrationName, true),
    },
    {
      id: 'seed',
      label: 'Seed file',
      title: 'Download as seed file',
      description:
        'If your query consists of sample data, append the snippet to the end of `supabase/seed.sql`',
      cli: generateSeedCliCommand(id),
      npm: generateSeedCliCommand(id, true),
    },
    {
      id: 'sql',
      label: 'SQL file',
      title: 'Download as SQL file',
      description: `Download the snippet directly into a new SQL file named \`${migrationName}.sql\``,
      cli: generateFileCliCommand(id, migrationName),
      npm: generateFileCliCommand(id, migrationName, true),
    },
  ]

  return (
    <Modal
      hideFooter
      showCloseButton
      size="xlarge"
      header={<p>Download snippet as local migration file via the Supabase CLI.</p>}
      {...props}
    >
      <div className="flex flex-col items-start justify-between gap-4 py-5 relative">
        <Tabs type="underlined" listClassNames="pl-5">
          {SNIPPETS.map((snippet) => {
            return (
              <Tabs.Panel key={snippet.id} id={snippet.id} label={snippet.label} className="px-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex flex-col gap-y-1">
                    <h2 className="text-lg">{snippet.title}</h2>
                    <Markdown
                      className="text-sm text-scale-1000 [&>p>code]:!break-normal"
                      content={snippet.description}
                    />
                  </div>
                  <TwoOptionToggle
                    width={75}
                    options={['CLI', 'NPM']}
                    activeOption={selectedView}
                    borderOverride="border-muted"
                    onClickOption={() =>
                      selectedView === 'CLI' ? setSelectedView('NPM') : setSelectedView('CLI')
                    }
                  />
                </div>
                <pre>
                  <CodeBlock
                    language="bash"
                    className="language-bash prose dark:prose-dark max-w-none"
                  >
                    {selectedView === 'CLI' ? snippet.cli : snippet.npm}
                  </CodeBlock>
                </pre>
              </Tabs.Panel>
            )
          })}
        </Tabs>
        <div className="w-full flex items-center justify-between">
          <p className="text-xs text-lighter mx-5">Run this command from your project directory</p>
          <div className="flex justify-between items-center gap-x-2 mx-5">
            <Button asChild type="default" icon={<IconExternalLink size={14} strokeWidth={1.5} />}>
              <Link
                href="https://supabase.com/docs/guides/cli/local-development#database-migrations"
                target="_blank"
                rel="noreferrer"
              >
                About migrations
              </Link>
            </Button>

            <Button asChild type="default" icon={<IconExternalLink size={14} strokeWidth={1.5} />}>
              <Link
                href="https://supabase.com/docs/guides/cli/local-development"
                target="_blank"
                rel="noreferrer"
              >
                About CLI
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default DownloadSnippetModal
