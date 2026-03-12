import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { DocsButton } from 'components/ui/DocsButton'
import { getKeys, useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { VectorBucketIndex } from 'data/storage/vector-buckets-indexes-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { SqlEditor } from 'icons'
import { DOCS_URL } from 'lib/constants'
import { ChevronDown, ListPlus } from 'lucide-react'
import Link from 'next/link'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useState } from 'react'
import {
  Button,
  CodeBlock,
  CommandGroup_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Command_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetSection,
  SheetTitle,
  SheetTrigger,
  cn,
} from 'ui'
import { Admonition } from 'ui-patterns'

import { useS3VectorsWrapperExtension } from '../useS3VectorsWrapper'
import { useS3VectorsWrapperInstance } from '../useS3VectorsWrapperInstance'
import { isGreaterThanOrEqual } from '@/lib/semver'

interface VectorBucketTableExamplesSheetProps {
  index: VectorBucketIndex
}

export const VectorBucketTableExamplesSheet = ({ index }: VectorBucketTableExamplesSheetProps) => {
  const metadataKeys = index.metadataConfiguration?.nonFilterableMetadataKeys ?? []
  const [open, setOpen] = useState(false)
  const [language, setLanguage] = useState<'javascript' | 'sql'>('sql')
  const [showLanguage, setShowLanguage] = useState(false)

  const [_, setOpenImportForeignSchemaDialog] = useQueryState(
    'initForeignSchema',
    parseAsBoolean.withDefault(false)
  )

  const updateLanguage = (value: 'javascript' | 'sql') => {
    setLanguage(value)
    setShowLanguage(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* Move into overflow menu after vectors added */}
      <SheetTrigger asChild>
        <Button type="default" icon={<ListPlus size={12} className="text-foreground-lighter" />}>
          Insert vectors
        </Button>
      </SheetTrigger>
      <SheetContent tabIndex={undefined}>
        <div className="flex flex-col h-full" tabIndex={-1}>
          <SheetHeader>
            <SheetTitle>
              Insert vectors into{' '}
              <code className="text-code-inline !text-sm">{index.indexName}</code>
            </SheetTitle>
          </SheetHeader>

          <div className="overflow-auto flex-grow">
            <VectorBucketIndexExamples
              bucketName={index.vectorBucketName}
              indexName={index.indexName}
              dimension={index.dimension}
              metadataKeys={metadataKeys}
              language={language}
              showLanguage={showLanguage}
              onLanguageChange={updateLanguage}
              onShowLanguageChange={setShowLanguage}
              onSelectQueryFromPostgres={() => {
                setOpen(false)
                setOpenImportForeignSchemaDialog(true)
              }}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

const generateDimensionExample = (startValue: number, dimension: number) => {
  if (dimension >= 3) {
    // For 3+ dimensions, show only first 2 values with ellipsis
    return `${startValue.toFixed(1)}, ${(startValue + 0.1).toFixed(1)}, ...`
  } else if (dimension === 2) {
    // For 2 dimensions, show both values
    return `${startValue.toFixed(1)}, ${(startValue + 0.1).toFixed(1)}`
  } else {
    // For 1 dimension, show single value
    return startValue.toFixed(1)
  }
}

const generateDimensionComment = (dimension: number) => {
  // Only add comment for 3+ dimensions
  if (dimension >= 3) {
    return ` // Data should match ${dimension} dimensions`
  }
  return ''
}

interface VectorBucketIndexExamplesProps {
  bucketName: string
  indexName: string
  dimension: number
  metadataKeys: string[]
  language: 'javascript' | 'sql'
  showLanguage: boolean
  onLanguageChange: (value: 'javascript' | 'sql') => void
  onShowLanguageChange: (show: boolean) => void
  onSelectQueryFromPostgres: () => void
}

function VectorBucketIndexExamples({
  bucketName,
  indexName,
  dimension,
  metadataKeys,
  language,
  showLanguage,
  onLanguageChange,
  onShowLanguageChange,
  onSelectQueryFromPostgres,
}: VectorBucketIndexExamplesProps) {
  const { ref: projectRef, bucketId } = useParams()

  const { can: canReadAPIKeys } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'service_api_keys'
  )
  const { data: apiKeys } = useAPIKeysQuery({ projectRef }, { enabled: canReadAPIKeys })
  const { secretKey } = canReadAPIKeys ? getKeys(apiKeys) : { secretKey: null }

  const { data: wrapperInstance } = useS3VectorsWrapperInstance({ bucketId })
  const foreignTable = wrapperInstance?.tables?.find((x) => x.name === indexName)

  const { extension: wrappersExtension } = useS3VectorsWrapperExtension()
  const updatedImportForeignSchemaSyntax = !!wrappersExtension?.installed_version
    ? isGreaterThanOrEqual(wrappersExtension.installed_version, '0.5.7')
    : false

  const dimensionLabel = `Data should match ${dimension} dimension${dimension > 1 ? 's' : ''}`
  const startValue = 0.1
  const dimensionComment = generateDimensionComment(dimension)
  const dimensionExample = generateDimensionExample(startValue, dimension)
  const sqlComment = dimension >= 3 ? ` -- ${dimensionLabel}` : ''

  const sqlCode = `-- Insert multiple vectors
insert into
  "${foreignTable?.schema}"."${foreignTable?.name}" (key, data, metadata)
values
  (
    'doc-1',
    '[${dimensionExample}]'${updatedImportForeignSchemaSyntax ? '::s3vec' : '::embd'}${sqlComment},
    '{${metadataKeys.map((key) => `"${key}": "${key} value"`).join(', ')}}'::jsonb
  ),
  (
    'doc-2',
    '[${dimensionExample}]'${updatedImportForeignSchemaSyntax ? '::s3vec' : '::embd'}${sqlComment},
    '{${metadataKeys.map((key) => `"${key}": "${key} value"`).join(', ')}}'::jsonb
  );`

  const jsCode = `import { createClient } from '@supabase/supabase-js'

// Adding vector data requires a secret or service role key 
// This code SHOULD NOT be run on the client side as you will be vulnerable to a data leak
const client = createClient(
  process.env.SUPABASE_URL,
  process.env.${secretKey ? 'SUPABASE_SECRET_KEY' : 'SUPABASE_SERVICE_ROLE_KEY'},
)

const index = client.storage.vectors
  .from('${bucketName}')
  .index('${indexName}')

const result = await index.putVectors({
  vectors: [
    {
      key: 'doc-1',
      data: { float32: [${dimensionExample}] }${dimensionComment},
      metadata: { ${metadataKeys.map((key) => `${key}: "${key} value"`).join(', ')} },
    },
    {
      key: 'doc-2',
      data: { float32: [${dimensionExample}] }${dimensionComment},
      metadata: { ${metadataKeys.map((key) => `${key}: "${key} value"`).join(', ')} },
    },
  ],
})`

  return (
    <SheetSection className="flex flex-col gap-6">
      <p className="text-sm text-foreground-light">
        Use the following code snippet to insert vectors into your table. The{' '}
        <code className="text-code-inline">data</code> property should contain all of your vector
        data.
      </p>
      <div className="flex flex-col gap-2">
        <div className="flex justify-between">
          <Popover_Shadcn_ modal={false} open={showLanguage} onOpenChange={onShowLanguageChange}>
            <PopoverTrigger_Shadcn_ asChild>
              <div className="flex cursor-pointer">
                <span className="flex items-center text-foreground-lighter px-3 rounded-lg rounded-r-none text-xs border border-button border-r-0">
                  Language
                </span>
                <Button
                  type="default"
                  iconRight={<ChevronDown size={14} strokeWidth={2} />}
                  className="rounded-l-none"
                >
                  {language === 'javascript' ? 'JavaScript' : 'SQL'}
                </Button>
              </div>
            </PopoverTrigger_Shadcn_>
            <PopoverContent_Shadcn_ className="p-0 w-32" side="bottom" align="end">
              <Command_Shadcn_>
                <CommandList_Shadcn_>
                  <CommandGroup_Shadcn_>
                    <CommandItem_Shadcn_
                      className="cursor-pointer"
                      onSelect={() => onLanguageChange('sql')}
                      onClick={() => onLanguageChange('sql')}
                    >
                      <p>SQL</p>
                    </CommandItem_Shadcn_>
                    <CommandItem_Shadcn_
                      className="cursor-pointer"
                      onSelect={() => onLanguageChange('javascript')}
                      onClick={() => onLanguageChange('javascript')}
                    >
                      <p>JavaScript</p>
                    </CommandItem_Shadcn_>
                  </CommandGroup_Shadcn_>
                </CommandList_Shadcn_>
              </Command_Shadcn_>
            </PopoverContent_Shadcn_>
          </Popover_Shadcn_>

          <DocsButton
            href={`${DOCS_URL}/guides/storage/vector/storing-vectors?queryGroups=language&language=${language}#basic-vector-insertion`}
          />
        </div>
        {language === 'javascript' ? (
          <CodeBlock
            hideLineNumbers
            wrapperClassName={cn('[&_pre]:px-4 [&_pre]:py-3')}
            className="[&_code]:text-foreground"
            language="js"
            value={jsCode}
          />
        ) : !foreignTable ? (
          <Admonition
            type="default"
            title="Insert data via SQL with a Foreign Data Wrapper"
            description="Data from vector tables can be queried and inserted from Postgres with the S3 Vectors Wrapper as foreign tables."
            actions={
              <Button type="default" onClick={onSelectQueryFromPostgres}>
                Query from Postgres
              </Button>
            }
          />
        ) : (
          <>
            <CodeBlock
              hideLineNumbers
              wrapperClassName={cn('[&_pre]:px-4 [&_pre]:py-3')}
              className="[&_code]:text-foreground"
              language="sql"
              value={sqlCode}
            />
            <div className="flex justify-end">
              <Button
                type="default"
                asChild
                icon={<SqlEditor size={12} className="text-foreground-lighter" />}
              >
                <Link
                  target="_blank"
                  rel="noreferrer"
                  href={`/project/${projectRef}/sql/new?content=${encodeURIComponent(sqlCode)}`}
                >
                  Query in SQL Editor
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </SheetSection>
  )
}
