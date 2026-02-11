import Editor from '@monaco-editor/react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useMemo, useRef } from 'react'

import { useParams } from 'common'
import { Footer } from 'components/grid/components/footer/Footer'
import { useTableDefinitionQuery } from 'data/database/table-definition-query'
import { useViewDefinitionQuery } from 'data/database/view-definition-query'
import {
  Entity,
  isMaterializedView,
  isTableLike,
  isView,
  isViewLike,
} from 'data/table-editor/table-editor-types'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { formatSql } from 'lib/formatSql'
import { timeout } from 'lib/helpers'
import { Button } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

export interface TableDefinitionProps {
  entity?: Entity
}

export const TableDefinition = ({ entity }: TableDefinitionProps) => {
  const { ref } = useParams()
  const editorRef = useRef(null)
  const monacoRef = useRef(null)
  const { resolvedTheme } = useTheme()
  const { data: project } = useSelectedProjectQuery()

  const viewResult = useViewDefinitionQuery(
    {
      id: entity?.id,
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    {
      enabled: isViewLike(entity),
    }
  )

  const tableResult = useTableDefinitionQuery(
    {
      id: entity?.id,
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    {
      enabled: isTableLike(entity),
    }
  )

  const isViewEntity = isViewLike(entity)
  const { data, isLoading } = isViewEntity ? viewResult : tableResult

  const definition = isViewEntity && data && typeof data === 'object' && 'definition' in data
    ? (data as { definition: string; options: string | null }).definition
    : (data as string | undefined)

  const viewOptions = isViewEntity && data && typeof data === 'object' && 'options' in data
    ? (data as { definition: string; options: string | null }).options
    : null

  const optionsClause = viewOptions ? ` with (${viewOptions})` : ''

  const prepend = isView(entity)
    ? `create view ${entity.schema}.${entity.name}${optionsClause} as\n`
    : isMaterializedView(entity)
      ? `create materialized view ${entity.schema}.${entity.name}${optionsClause} as\n`
      : ''

  const formattedDefinition = useMemo(
    () => (definition ? formatSql(prepend + definition) : undefined),
    [definition, prepend]
  )

  const handleEditorOnMount = async (editor: any, monaco: any) => {
    editorRef.current = editor
    monacoRef.current = monaco

    // add margin above first line
    editor.changeViewZones((accessor: any) => {
      accessor.addZone({
        afterLineNumber: 0,
        heightInPx: 4,
        domNode: document.createElement('div'),
      })
    })

    // when editor did mount, it will need a delay before focus() works properly
    await timeout(500)
    editor?.focus()
  }

  if (isLoading) {
    return (
      <div className="h-full grid">
        <div className="p-4">
          <GenericSkeletonLoader />
        </div>
        <div className="mt-auto">
          <Footer />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex-grow overflow-y-auto border-t border-muted relative">
        <Button asChild type="default" className="absolute top-2 right-5 z-10">
          <Link
            href={`/project/${ref}/sql/new?content=${encodeURIComponent(
              formattedDefinition ?? ''
            )}`}
          >
            Open in SQL Editor
          </Link>
        </Button>
        <Editor
          className="monaco-editor"
          theme={resolvedTheme?.includes('dark') ? 'vs-dark' : 'vs'}
          onMount={handleEditorOnMount}
          defaultLanguage="pgsql"
          value={formattedDefinition}
          path={''}
          options={{
            domReadOnly: true,
            readOnly: true,
            tabSize: 2,
            fontSize: 13,
            minimap: { enabled: false },
            wordWrap: 'on',
            fixedOverflowWidgets: true,
          }}
        />
      </div>

      <Footer />
    </>
  )
}
