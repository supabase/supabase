import { ModalProps } from '@ui/components/Modal/Modal'
import { snakeCase } from 'lodash'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'
import { Button, CodeBlock, IconExternalLink, Modal, Separator, Tabs, TabsProvider } from 'ui'
import { useState } from 'react'
import {
  generateFileCliCommand,
  generateMigrationCliCommand,
  generateSeedCliCommand,
} from './SQLEditor.utils'
import TwoOptionToggle from 'components/ui/TwoOptionToggle'
import Link from 'next/link'

export interface DownloadSnippetModalProps extends ModalProps {
  id: string
}

const DownloadSnippetModal = ({ id, ...props }: DownloadSnippetModalProps) => {
  const snap = useSqlEditorStateSnapshot()
  const snippet = snap.snippets[id].snippet
  const migrationName = snakeCase(snippet.name)

  const [selectedView, setSelectedView] = useState<'CLI' | 'NPM'>('CLI')

  return (
    <Modal
      hideFooter
      showCloseButton
      size="xlarge"
      header={<p>Download snippet as local migration file via the Supabase CLI.</p>}
      {...props}
    >
      <TabsProvider>
        <div className="flex flex-col items-start justify-between gap-4 py-5 relative mb-2">
          <div className="absolute top-14 right-0">
            <TwoOptionToggle
              width={75}
              options={['CLI', 'NPM']}
              activeOption={selectedView}
              borderOverride="border-gray-100"
              onClickOption={() =>
                selectedView === 'CLI' ? setSelectedView('NPM') : setSelectedView('CLI')
              }
            />
          </div>
          <Tabs type="underlined" listClassNames="pl-5">
            <Tabs.Panel id="migration" label="Migration" className="px-5">
              <div className="flex flex-col gap-y-2 mb-3 w-full">
                <h2 className="text-lg">Download as migration</h2>
                <p className="text-sm text-scale-1000">
                  Download the snippet in a new migration named{' '}
                  <code className="text-xs">{migrationName}</code>:
                </p>
              </div>

              {selectedView === 'CLI' ? (
                <CodeBlock
                  language="bash"
                  className="language-bash prose dark:prose-dark max-w-none"
                >
                  {generateMigrationCliCommand(id, migrationName)}
                </CodeBlock>
              ) : (
                <pre>
                  <CodeBlock
                    language="bash"
                    className="language-bash prose dark:prose-dark max-w-none"
                  >
                    {generateMigrationCliCommand(id, migrationName, true)}
                  </CodeBlock>
                </pre>
              )}
            </Tabs.Panel>
            <Tabs.Panel id="seed" label="Seed file" className="px-5">
              <div className="flex flex-col gap-y-2 mb-3 w-full">
                <h2 className="text-lg">Download as seed file</h2>
                <p className="text-sm text-scale-1000">
                  If your query consists of sample data, append the snippet to the end of{' '}
                  <code className="text-xs">supabase/seed.sql</code>:
                </p>
              </div>
              {selectedView === 'CLI' ? (
                <CodeBlock
                  language="bash"
                  className="language-bash prose dark:prose-dark max-w-none"
                >
                  {generateSeedCliCommand(id)}
                </CodeBlock>
              ) : (
                <CodeBlock
                  language="bash"
                  className="language-bash prose dark:prose-dark max-w-none"
                >
                  {generateSeedCliCommand(id, true)}
                </CodeBlock>
              )}
            </Tabs.Panel>
            <Tabs.Panel id="sql" label="SQL file" className="px-5">
              <div className="flex flex-col gap-y-2 mb-3 w-full">
                <h2 className="text-lg">Download as SQL file</h2>
                <p className="text-sm text-scale-1000">
                  Download the snippet directly into a new SQL file named{' '}
                  <code className="text-xs">{`${migrationName}.sql`}</code>:
                </p>
              </div>

              {selectedView === 'CLI' ? (
                <CodeBlock
                  language="bash"
                  className="language-bash prose dark:prose-dark max-w-none"
                >
                  {generateFileCliCommand(id, migrationName)}
                </CodeBlock>
              ) : (
                <CodeBlock
                  language="bash"
                  className="language-bash prose dark:prose-dark max-w-none"
                >
                  {generateFileCliCommand(id, migrationName, true)}
                </CodeBlock>
              )}
            </Tabs.Panel>
            <p className="text-xs text-lighter mt-4 text-right mr-6 mb-4">
              * Run from your local <code>/supabase</code> directory
            </p>
          </Tabs>
          <Separator className="mt-4" />
          <div className="flex mx-5 justify-between items-center ml-auto">
            <p className="text-sm">Learn more about:</p>
            <div className="flex items-center space-x-2 ml-4">
              <Button
                asChild
                type="default"
                icon={<IconExternalLink size={14} strokeWidth={1.5} />}
              >
                <Link
                  href="https://supabase.com/docs/guides/cli/local-development#database-migrations"
                  target="_blank"
                  rel="noreferrer"
                >
                  Migrations
                </Link>
              </Button>

              <Button
                asChild
                type="default"
                icon={<IconExternalLink size={14} strokeWidth={1.5} />}
              >
                <Link
                  href="https://supabase.com/docs/guides/cli/local-development"
                  target="_blank"
                  rel="noreferrer"
                >
                  Local Development
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </TabsProvider>
    </Modal>
  )
}

export default DownloadSnippetModal
