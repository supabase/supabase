import Link from 'next/link'
import SVG from 'react-inlinesvg'
import { FC, useContext } from 'react'
import { observer } from 'mobx-react-lite'
import { Input, Typography, Listbox } from '@supabase/ui'

import { CreateHookContext } from './'
import { useStore } from 'hooks'

const TableSelection: FC = observer(({}) => {
  const { ui } = useStore()
  const projectRef = ui.selectedProject?.ref
  const _localState: any = useContext(CreateHookContext)

  if (_localState.tables.length === 0) {
    return (
      <Input
        label="Table"
        layout="horizontal"
        disabled
        placeholder="No tables created, please create one first"
        // @ts-ignore
        descriptionText={
          <div className="space-x-1">
            <Typography.Text type="secondary">
              This is the table the trigger will watch for changes. There's currently no tables
              created - please create one
            </Typography.Text>
            <Link href={`/project/${projectRef}/editor`}>
              <a>
                <Typography.Link>here</Typography.Link>
              </a>
            </Link>
            <Typography.Text type="secondary">first.</Typography.Text>
          </div>
        }
      />
    )
  }

  return (
    <Listbox
      id="table"
      label="Table"
      layout="horizontal"
      value={_localState.formState.tableId.value}
      onChange={(id) => {
        const _table = _localState.tables.find((x: any) => x.id === id)
        if (_table) {
          _localState.onFormChange({
            key: 'schema',
            value: _table.schema,
          })
          _localState.onFormChange({
            key: 'table',
            value: _table.name,
          })
          _localState.onFormChange({
            key: 'tableId',
            value: id,
          })
        }
      }}
      size="medium"
      error={_localState.formState.table.error}
      descriptionText="This is the table the trigger will watch for changes. You can only select 1 table for a trigger."
    >
      {_localState.tables.map((x: any) => {
        return (
          <Listbox.Option
            id={x.id}
            key={x.id}
            value={x.id}
            label={x.name}
            addOnBefore={() => (
              <div className="bg-scale-1200 text-scale-100 flex items-center justify-center rounded p-1 ">
                <SVG
                  src={'/img/table-editor.svg'}
                  style={{ width: `16px`, height: `16px`, strokeWidth: '1px' }}
                  preProcessor={(code) =>
                    code.replace(/svg/, 'svg class="m-auto text-color-inherit"')
                  }
                />
              </div>
            )}
          >
            <div className="flex flex-row items-center space-x-1">
              <Typography.Text>{x.name}</Typography.Text>
              <Typography.Text type="secondary" className="opacity-50" small>
                {x.schema}
              </Typography.Text>
            </div>
          </Listbox.Option>
        )
      })}
    </Listbox>
  )
})

export default TableSelection
