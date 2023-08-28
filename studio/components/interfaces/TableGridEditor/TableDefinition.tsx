import Editor from '@monaco-editor/react'
import { useTheme } from 'common'
import { observer } from 'mobx-react-lite'
import { useMemo, useRef } from 'react'
import { format } from 'sql-formatter'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useTableDefinitionQuery } from 'data/database/table-definition-query'
import { useViewDefinitionQuery } from 'data/database/view-definition-query'
import { ENTITY_TYPE } from 'data/entity-types/entity-type-constants'
import useEntityType from 'hooks/misc/useEntityType'
import { timeout } from 'lib/helpers'

export interface TableDefinitionProps {
  id?: number
}

const TableDefinition = ({ id }: TableDefinitionProps) => {
  const editorRef = useRef(null)
  const monacoRef = useRef(null)
  const { isDarkMode } = useTheme()
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
      <div className="py-4 space-y-2">
        <ShimmeringLoader />
        <ShimmeringLoader className="w-3/4" />
        <ShimmeringLoader className="w-1/2" />
      </div>
    )
  }

  return (
    <div className="flex-grow overflow-y-auto border-t border-scale-400">
      <Editor
        className="monaco-editor"
        theme={isDarkMode ? 'vs-dark' : 'vs'}
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
