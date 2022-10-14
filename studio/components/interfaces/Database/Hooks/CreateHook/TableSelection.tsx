import Link from 'next/link'
import SVG from 'react-inlinesvg'
import { FC, useContext } from 'react'
import { observer } from 'mobx-react-lite'
import { Input, Listbox } from 'ui'

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
          <p className="text-scale-1000">
            <span className="text-scale-1000">
              This is the table the trigger will watch for changes. There's currently no tables
              created - please create one{' '}
            </span>
            <Link href={`/project/${projectRef}/editor`}>
              <a className="text-brand-900">here</a>
            </Link>
            <span className="text-scale-1000"> first.</span>
          </p>
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
              <div className="flex items-center justify-center rounded bg-scale-1200 p-1 text-scale-100 ">
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
            <div className="flex flex-row items-center space-x-2">
              <p>{x.name}</p>
              <p className="text-scale-1100">{x.schema}</p>
            </div>
          </Listbox.Option>
        )
      })}
    </Listbox>
  )
})

export default TableSelection
