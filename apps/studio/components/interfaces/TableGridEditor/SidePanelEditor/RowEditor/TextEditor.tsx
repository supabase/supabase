import type { OnMount } from '@monaco-editor/react'
import { MAX_CHARACTERS } from '@supabase/pg-meta/src/query/table-row-query'
import { useParams } from 'common'
import { useCallback, useEffect, useState } from 'react'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'
import { Button, cn, SidePanel } from 'ui'

import { ActionBar } from '../ActionBar'
import { isValueTruncated } from './RowEditor.utils'
import { Markdown } from '@/components/interfaces/Markdown'
import { CodeEditor } from '@/components/ui/CodeEditor/CodeEditor'
import { TwoOptionToggle } from '@/components/ui/TwoOptionToggle'
import { useTableEditorQuery } from '@/data/table-editor/table-editor-query'
import { isTableLike } from '@/data/table-editor/table-editor-types'
import { useGetCellValueMutation } from '@/data/table-rows/get-cell-value-mutation'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

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
  const { data: project } = useSelectedProjectQuery()

  const { data: selectedTable } = useTableEditorQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id,
  })

  const [strValue, setStrValue] = useState('')
  const [view, setView] = useState<'edit' | 'view'>('edit')
  const value = row?.[column as keyof typeof row] as unknown as string
  const isTruncated = isValueTruncated(value)

  const { mutate: getCellValue, isPending, isSuccess, reset } = useGetCellValueMutation()

  const loadFullValue = () => {
    if (
      selectedTable === undefined ||
      project === undefined ||
      row === undefined ||
      !isTableLike(selectedTable)
    )
      return
    if (selectedTable.primary_keys.length === 0) {
      return toast('Unable to load value as table has no primary keys')
    }

    const pkMatch = selectedTable.primary_keys.reduce((a, b) => {
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

  const saveValue = useCallback(
    (nextValue: string, resolve: () => void) => {
      if (onSaveField) onSaveField(nextValue, resolve)
    },
    [onSaveField]
  )

  const handleEditorMount: OnMount = useCallback(
    (editor, monaco) => {
      if (readOnly) return

      editor.addAction({
        id: 'save-value',
        label: 'Save value',
        keybindings: [monaco.KeyMod.CtrlCmd + monaco.KeyCode.Enter],
        run: () => saveValue(editor.getValue(), () => undefined),
      })
    },
    [readOnly, saveValue]
  )

  useEffect(() => {
    if (visible) {
      setView('edit')
      setStrValue(value)
    }
  }, [visible])

  // reset the mutation when the panel closes. Fixes an issue where the value is truncated if you close and reopen the
  // panel again
  const onClose = useCallback(() => {
    reset()
    closePanel()
  }, [reset])

  return (
    <SidePanel
      size="large"
      visible={visible}
      onCancel={onClose}
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
              onClickOption={(value) => setView(value as 'view' | 'edit')}
            />
          )}
        </div>
      }
      customFooter={
        <ActionBar
          hideApply={readOnly}
          closePanel={onClose}
          backButtonLabel="Cancel"
          applyButtonLabel="Save value"
          applyFunction={readOnly ? undefined : (resolve) => saveValue(strValue, resolve)}
        />
      }
    >
      <div className="relative flex flex-auto h-full flex-col gap-y-4">
        {view === 'edit' ? (
          <div className="w-full h-full grow">
            <CodeEditor
              key={value}
              isReadOnly={readOnly}
              language="markdown"
              value={strValue ?? ''}
              onInputChange={(val) => setStrValue(val ?? '')}
              onMount={handleEditorMount}
            />
          </div>
        ) : (
          <SidePanel.Content className="py-4 bg-default grow">
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
            <Button variant="default" loading={isPending} onClick={loadFullValue}>
              Load full text data
            </Button>
          </div>
        )}
      </div>
    </SidePanel>
  )
}
