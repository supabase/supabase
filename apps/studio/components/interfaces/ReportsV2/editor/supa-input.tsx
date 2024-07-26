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
import { RefreshCwIcon, Trash2Icon } from 'lucide-react'
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
  const [mode, setMode] = useState<'edit' | 'view'>('edit')

  return (
    <NodeViewWrapper>
      {mode === 'edit' ? (
        <div
          onClick={(e) => {
            e.stopPropagation()
          }}
          className="flex flex-col mt-8 group gap-4"
        >
          <Label>Input Name</Label>
          <p>This will be used to reference this input in your SQL queries.</p>
          <Input_Shadcn_ value={inputName} onChange={(e) => setInputName(e.target.value)} />
          <Button
            onClick={() => {
              props.updateAttributes({ name: inputName })
              setMode('view')
            }}
          >
            Save
          </Button>
        </div>
      ) : (
        <div>
          <Label>{inputName}</Label>
          <Input_Shadcn_
            value={router.query[inputName]}
            onChange={(e) => {
              // Update URL param
              router.push({
                ...router,
                query: {
                  ...router.query,
                  [inputName]: e.target.value,
                },
              })
            }}
          />
        </div>
      )}
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
