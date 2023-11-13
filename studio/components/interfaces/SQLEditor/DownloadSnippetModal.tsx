import { ModalProps } from '@ui/components/Modal/Modal'
import { snakeCase } from 'lodash'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'
import { CodeBlock, Modal, Separator, Tabs, TabsProvider } from 'ui'
import { useState } from 'react'
import {
  generateFileCliCommand,
  generateMigrationCliCommand,
  generateSeedCliCommand,
} from './SQLEditor.utils'
import TwoOptionToggle from 'components/ui/TwoOptionToggle'

export interface DownloadSnippetModalProps extends ModalProps {
  id: string
}

const DownloadSnippetModal = ({ id, ...props }: DownloadSnippetModalProps) => {
  const snap = useSqlEditorStateSnapshot()
  const snippet = snap.snippets[id].snippet
  const migrationName = snakeCase(snippet.name)

  const [selectedView, setSelectedView] = useState<'CLI' | 'NPM'>('CLI')

  const setView = () => {
    if (selectedView === 'CLI') {
      setSelectedView('NPM')
    } else {
      setSelectedView('CLI')
    }
  }

  return (
    <Modal size="xlarge" header="Download snippet" hideFooter closable {...props}>
      <div className="flex flex-col items-start justify-between gap-4 px-6 py-3 mb-4">
        <p className="text-sm mt-2">
          You can download this snippet as a local{' '}
          <a
            className="text-brand"
            href="https://supabase.com/docs/guides/cli/local-development#database-migrations"
            target="_blank"
            rel="noopener"
          >
            migration
          </a>{' '}
          file via the{' '}
          <a
            className="text-brand"
            href="https://supabase.com/docs/guides/cli/getting-started"
            target="_blank"
            rel="noopener"
          >
            Supabase CLI
          </a>
          .
        </p>
        <Separator />
      </div>

      <TabsProvider>
        <div className="flex flex-col items-start justify-between gap-4 px-6 py-3 relative mb-6">
          <div className="absolute top-1 right-6">
            <TwoOptionToggle
              width={75}
              options={['CLI', 'NPM']}
              activeOption={selectedView}
              borderOverride="border-gray-100"
              onClickOption={setView}
            />
          </div>

          <Tabs type="underlined">
            <Tabs.Panel id="migration" label="Migration">
              <div className="flex flex-col gap-2 my-2 w-full">
                <h2 className="text-lg">Download as migration</h2>
                <p className="text-sm text-scale-1000">
                  Use the snippet in a new migration named{' '}
                  <CodeBlock language="bash">{migrationName}</CodeBlock>:
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
            <Tabs.Panel id="seed" label="Seed file">
              <div className="flex flex-col gap-2 my-2 w-full">
                <h2 className="text-lg">Download as seed file</h2>
                <p className="text-sm text-scale-1000">
                  Alternatively if your query consists of sample data, append the snippet to the end
                  of <CodeBlock language="bash">supabase/seed.sql</CodeBlock>:
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

            <Tabs.Panel id="sql" label="SQL file">
              <div className="flex flex-col gap-2 my-2 w-full">
                <h2 className="text-lg">Download as SQL file</h2>
                <p className="text-sm text-scale-1000">
                  You can also download the snippet directly into a new SQL file named{' '}
                  <CodeBlock language="bash">{`${migrationName}.sql`}</CodeBlock>:
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
          </Tabs>
        </div>
      </TabsProvider>
    </Modal>
  )
}

export default DownloadSnippetModal
