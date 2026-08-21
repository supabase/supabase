import { snakeCase } from 'lodash'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  type DialogProps,
} from 'ui'
import { CodeBlock } from 'ui-patterns/CodeBlock'

import {
  generateFileCliCommand,
  generateMigrationCliCommand,
  generateSeedCliCommand,
} from './SQLEditor.utils'
import { TwoOptionToggle } from '@/components/ui/TwoOptionToggle'
import { DOCS_URL } from '@/lib/constants'
import { useSqlEditorV2StateSnapshot } from '@/state/sql-editor/sql-editor-state'

const CLI_DOCS_URL = `${DOCS_URL}/guides/cli/local-development`

export interface DownloadSnippetModalProps extends DialogProps {
  id: string
}

type DownloadFormat = 'migration' | 'seed' | 'sql'

export const DownloadSnippetModal = ({ id, ...props }: DownloadSnippetModalProps) => {
  const snapV2 = useSqlEditorV2StateSnapshot()

  const snippet = snapV2.snippets[id]?.snippet
  const migrationName = snakeCase(snippet?.name)

  const [downloadFormat, setDownloadFormat] = useState<DownloadFormat>('migration')
  const [selectedView, setSelectedView] = useState<'CLI' | 'NPX'>('CLI')

  const SNIPPETS = [
    {
      id: 'migration' as const,
      label: 'Migration',
      caption: (
        <>
          Run this command from your project directory to download the snippet in a new migration
          named <code className="text-code-inline break-normal">{migrationName}</code>.
        </>
      ),
      docLink: {
        label: 'About migrations',
        href: `${DOCS_URL}/guides/deployment/database-migrations`,
      },
      cli: generateMigrationCliCommand(id, migrationName),
      npx: generateMigrationCliCommand(id, migrationName, true),
    },
    {
      id: 'seed' as const,
      label: 'Seed file',
      caption: (
        <>
          Run this command from your project directory to download the snippet. If your query
          consists of sample data, append it to the end of{' '}
          <code className="text-code-inline break-normal">supabase/seed.sql</code>.
        </>
      ),
      docLink: {
        label: 'About seeding',
        href: `${DOCS_URL}/guides/local-development/seeding-your-database`,
      },
      cli: generateSeedCliCommand(id),
      npx: generateSeedCliCommand(id, true),
    },
    {
      id: 'sql' as const,
      label: 'SQL file',
      caption: (
        <>
          Run this command from your project directory to download the snippet into a new SQL file
          named <code className="text-code-inline break-normal">{migrationName}.sql</code>.
        </>
      ),
      cli: generateFileCliCommand(id, migrationName),
      npx: generateFileCliCommand(id, migrationName, true),
    },
  ]

  const selectedSnippet = SNIPPETS.find((s) => s.id === downloadFormat) ?? SNIPPETS[0]
  const commandValue = selectedView === 'CLI' ? selectedSnippet.cli : selectedSnippet.npx

  return (
    <Dialog {...props}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export query</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection className="flex flex-col gap-y-4">
          <div className="flex items-center justify-between gap-x-2">
            <p className="text-sm">Export as</p>
            <Select
              value={downloadFormat}
              onValueChange={(value) => setDownloadFormat(value as DownloadFormat)}
            >
              <SelectTrigger className="w-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SNIPPETS.map((snippet) => (
                  <SelectItem key={snippet.id} value={snippet.id}>
                    {snippet.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-y-2">
            <div className="flex items-center justify-between gap-x-2">
              <p className="text-sm">Run with</p>
              <TwoOptionToggle
                width={50}
                options={['CLI', 'NPX']}
                activeOption={selectedView}
                borderOverride="border-muted"
                onClickOption={() =>
                  selectedView === 'CLI' ? setSelectedView('NPX') : setSelectedView('CLI')
                }
              />
            </div>
            <CodeBlock
              language="bash"
              value={commandValue}
              hideLineNumbers
              wrapperClassName="[&_pre]:px-4 [&_pre]:py-3"
              className={cn(
                '!bg-surface-75 border-border [&_code]:text-[12px] [&_code]:text-foreground'
              )}
            />
            <p className="text-xs text-foreground-lighter leading-relaxed">
              {selectedSnippet.caption}
            </p>
          </div>
        </DialogSection>
        <DialogSection>
          <div className="flex items-center justify-start gap-x-2">
            {selectedSnippet.docLink && (
              <Button asChild variant="default" icon={<ExternalLink />}>
                <Link href={selectedSnippet.docLink.href} target="_blank" rel="noreferrer">
                  {selectedSnippet.docLink.label}
                </Link>
              </Button>
            )}

            <Button asChild variant="default" icon={<ExternalLink />}>
              <Link href={CLI_DOCS_URL} target="_blank" rel="noreferrer">
                About CLI
              </Link>
            </Button>
          </div>
        </DialogSection>
      </DialogContent>
    </Dialog>
  )
}
