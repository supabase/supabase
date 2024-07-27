'use client'
import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewProps } from '@tiptap/react'
import { useState } from 'react'
import { NodeViewWrapper, mergeAttributes } from '@tiptap/react'
import { BlockType, TiptapNodeViewProps } from './shared'
import DataGrid, { Column, RenderRowProps, Row } from 'react-data-grid'
import BarChart from 'components/ui/Charts/BarChart'
import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import { Button, Input_Shadcn_, cn } from 'ui'
import CodeEditor from 'components/ui/CodeEditor/CodeEditor'
import { GenericSkeletonLoader } from 'ui-patterns'
import { PencilIcon, RefreshCwIcon, Trash2Icon } from 'lucide-react'
import { Label } from '@ui/components/shadcn/ui/label'
import { useRouter } from 'next/router'

function SupaInputComponent(props: TiptapNodeViewProps<{ name: string }>) {
  const {
    node: {
      attrs: { name },
    },
  } = props

  // This input will have a label and a value, the value will be stored in the URL as a param
  // Using the label, you can get the value of the input in SQL blocks like this ${label}

  const router = useRouter()
  const [inputName, setInputName] = useState(name)
  const [inputValue, setInputValue] = useState(router.query[inputName] || '')
  const defaultMode = inputName.length ? 'view' : 'edit'
  const [mode, setMode] = useState<'edit' | 'view'>(defaultMode)

  return (
    <NodeViewWrapper>
      <div className="border border-border rounded-md px-6 py-4 shadow-sm selection:border-brand-300">
        {mode === 'edit' ? (
          <div
            onClick={(e) => {
              e.stopPropagation()
            }}
            className="max-w-xs"
          >
            <Label className="font-medium">Input Name</Label>
            <Input_Shadcn_
              className="mt-2"
              placeholder="Search"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
            />
            <div className="my-2 text-xs text-foreground-lighter">
              This will be used to reference this input in your SQL queries.
            </div>
            <Button
              className=""
              onClick={() => {
                props.updateAttributes({ name: inputName })
                setMode('view')
              }}
            >
              Save
            </Button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              router.push({
                ...router,
                query: {
                  ...router.query,
                  [inputName]: inputValue,
                },
              })
            }}
          >
            <Label>{inputName}</Label>
            <Input_Shadcn_ value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
            <div className="flex justify-between mt-2 items-center">
              <div className="text-xs text-foreground-lighter">
                Reference this input in your SQL queries like this:{' '}
                <code>
                  SELECT * FROM <span className="text-brand">{`'{{${inputName}}}'`}</span>
                </code>
              </div>
              <div className="flex gap-2">
                <Button type="text" htmlType="button" onClick={() => setMode('edit')}>
                  Edit
                </Button>
                <Button htmlType="submit">Submit</Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </NodeViewWrapper>
  )
}

const name = 'supa-input'
export const SupaInput = Node.create({
  name,
  group: 'block',

  addAttributes() {
    return {
      name: {
        default: '',
      },
    }
  },

  parseHTML() {
    return [{ tag: name }]
  },

  renderHTML({ HTMLAttributes }) {
    return [name, mergeAttributes(HTMLAttributes)]
  },

  addNodeView() {
    return ReactNodeViewRenderer(SupaInputComponent)
  },
})
