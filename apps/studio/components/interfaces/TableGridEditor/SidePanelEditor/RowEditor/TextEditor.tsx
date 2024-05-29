import { Editor } from '@monaco-editor/react'
import { PostgresTable } from '@supabase/postgres-meta'
import { Loader } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import remarkGfm from 'remark-gfm'

import { useParams } from 'common'
import { Markdown } from 'components/interfaces/Markdown'
import TwoOptionToggle from 'components/ui/TwoOptionToggle'
import { useGetCellValueMutation } from 'data/table-rows/get-cell-value-mutation'
import { MAX_CHARACTERS } from 'data/table-rows/table-rows-query'
import { useSelectedProject } from 'hooks'
import useTable from 'hooks/misc/useTable'
import { Button, SidePanel, cn } from 'ui'
import ActionBar from '../ActionBar'

interface TextEditorProps {
  visible: boolean
  readOnly?: boolean
  row?: { [key: string]: any }
  column: string
  closePanel: () => void
  onSaveField: (value: string, resolve: () => void) => void
}

export const TextEditor = ({
  visible,
  readOnly = false,
  row,
  column,
  closePanel,
  onSaveField,
}: TextEditorProps) => {
  const { id: _id } = useParams()
  const id = _id ? Number(_id) : undefined
  const { data: selectedTable } = useTable(id)
  const project = useSelectedProject()

  const [strValue, setStrValue] = useState('')
  const [view, setView] = useState<'edit' | 'view'>('edit')
  const value = row?.[column as keyof typeof row] as unknown as string
  const isTruncated = value?.endsWith('...') && value.length > MAX_CHARACTERS

  const { mutate: getCellValue, isLoading, isSuccess } = useGetCellValueMutation()

  const loadFullValue = () => {
    if (selectedTable === undefined || project === undefined || row === undefined) return
    if ((selectedTable as PostgresTable).primary_keys.length === 0) {
      return toast('Unable to load value as table has no primary keys')
    }

    const pkMatch = (selectedTable as PostgresTable).primary_keys.reduce((a, b) => {
      return { ...a, [b.name]: (row as any)[b.name] }
    }, {})

    getCellValue(
      {
        table: { schema: selectedTable.schema, name: selectedTable.name },
        column: column,
        pkMatch,
        projectRef: project?.ref,
        connectionString: project?.connectionString,
      },
      { onSuccess: (data) => setStrValue(data) }
    )
  }

  const saveValue = (resolve: () => void) => {
    if (onSaveField) onSaveField(strValue, resolve)
  }

  useEffect(() => {
    if (visible) {
      setView('edit')
      setStrValue(value)
    }
  }, [visible])

  return (
    <SidePanel
      size="large"
      visible={visible}
      onCancel={() => closePanel()}
      header={
        <div className="flex items-center justify-between">
          <p>
            {readOnly ? 'Viewing' : 'Editing'} value of: <code>{column}</code>
          </p>
          {(!isTruncated || (isTruncated && isSuccess)) && (
            <TwoOptionToggle
              options={['view', 'edit']}
              activeOption={view}
              borderOverride="border-muted"
              onClickOption={setView}
            />
          )}
        </div>
      }
      customFooter={
        <ActionBar
          hideApply={readOnly}
          closePanel={closePanel}
          backButtonLabel="Cancel"
          applyButtonLabel="Save value"
          applyFunction={readOnly ? undefined : saveValue}
        />
      }
    >
      <div className="relative flex flex-auto h-full flex-col gap-y-4">
        {view === 'edit' ? (
          <div className="w-full h-full flex-grow">
            <Editor
              key={value}
              theme="supabase"
              className="monaco-editor"
              defaultLanguage="markdown"
              value={strValue}
              loading={<Loader className="animate-spin" strokeWidth={2} size={20} />}
              options={{
                readOnly,
                tabSize: 2,
                fontSize: 13,
                minimap: {
                  enabled: false,
                },
                wordWrap: 'on',
                fixedOverflowWidgets: true,
                lineNumbersMinChars: 4,
              }}
              onMount={(editor) => {
                editor.changeViewZones((accessor) => {
                  accessor.addZone({
                    afterLineNumber: 0,
                    heightInPx: 4,
                    domNode: document.createElement('div'),
                  })
                })
                editor.focus()
              }}
              onChange={(val) => setStrValue(val ?? '')}
            />
          </div>
        ) : (
          <SidePanel.Content className="py-4 bg-default flex-grow">
            <Markdown
              remarkPlugins={[remarkGfm]}
              className="bg-default markdown-body"
              content={strValue}
            />
          </SidePanel.Content>
        )}
        {isTruncated && !isSuccess && (
          <div
            className={cn(
              'absolute top-0 left-0 flex items-center justify-center flex-col gap-y-3',
              'text-sm w-full h-full px-2 text-center',
              'bg-default/80 backdrop-blur-[1.5px]'
            )}
          >
            <div className="flex flex-col gap-y-1 w-80">
              <p>Text value is larger than {MAX_CHARACTERS.toLocaleString()} characters</p>
              <p className="text-foreground-light">
                You may try to render the entire text value, but your browser may run into
                performance issues
              </p>
            </div>
            <Button type="default" loading={isLoading} onClick={loadFullValue}>
              Load full text data
            </Button>
          </div>
        )}
      </div>
    </SidePanel>
  )
}
