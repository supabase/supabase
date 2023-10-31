import Editor from '@monaco-editor/react'
import { useTheme } from 'next-themes'
import { useParams } from 'common'
import { observer } from 'mobx-react-lite'
import { useMemo, useRef } from 'react'
import { format } from 'sql-formatter'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useTableDefinitionQuery } from 'data/database/table-definition-query'
import { useViewDefinitionQuery } from 'data/database/view-definition-query'
import { ENTITY_TYPE } from 'data/entity-types/entity-type-constants'
import useEntityType from 'hooks/misc/useEntityType'
import { timeout } from 'lib/helpers'
import Link from 'next/link'
import { Button } from 'ui'

export interface TableDefinitionProps {
  id?: number
}

const TableDefinition = ({ id }: TableDefinitionProps) => {
  const { ref } = useParams()
  const editorRef = useRef(null)
  const monacoRef = useRef(null)
  const { resolvedTheme } = useTheme()
  const entityType = useEntityType(id)
  const { project } = useProjectContext()

  const viewResult = useViewDefinitionQuery(
    {
      schema: entityType?.schema,
      name: entityType?.name,
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    {
      enabled:
        entityType?.type === ENTITY_TYPE.VIEW || entityType?.type === ENTITY_TYPE.MATERIALIZED_VIEW,
    }
  )

  const tableResult = useTableDefinitionQuery(
    {
      schema: entityType?.schema,
      name: entityType?.name,
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    {
      enabled: entityType?.type === ENTITY_TYPE.TABLE,
    }
  )

  const { data: definition, isLoading } =
    entityType?.type === ENTITY_TYPE.VIEW || entityType?.type === ENTITY_TYPE.MATERIALIZED_VIEW
      ? viewResult
      : tableResult

  const prepend =
    entityType?.type === ENTITY_TYPE.VIEW
      ? `create view ${entityType.schema}.${entityType.name} as\n`
      : entityType?.type === ENTITY_TYPE.MATERIALIZED_VIEW
      ? `create materialized view ${entityType.schema}.${entityType.name} as\n`
      : ''

  const formattedDefinition = useMemo(
    () =>
      definition
        ? format(prepend + definition, {
            language: 'postgresql',
            keywordCase: 'lower',
          })
        : undefined,
    [definition]
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
      <div className="p-4">
        <GenericSkeletonLoader />
      </div>
    )
  }

  return (
    <div className="flex-grow overflow-y-auto border-t border-muted relative">
      <Button asChild type="default" className="absolute top-2 right-5 z-10">
        <Link
          href={`/project/${ref}/sql/new?content=${encodeURIComponent(formattedDefinition ?? '')}`}
        >
          Open in SQL Editor
        </Link>
      </Button>
      <Editor
        className="monaco-editor"
        theme={resolvedTheme === 'dark' ? 'vs-dark' : 'vs'}
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
  )
}

export default observer(TableDefinition)
