import ColumnType from 'components/interfaces/TableGridEditor/SidePanelEditor/ColumnEditor/ColumnType'
import useLatest from 'hooks/misc/useLatest'
import { X } from 'lucide-react'
import { useEffect, useReducer } from 'react'
import { Button, Input } from 'ui'

export type SimpleColumn = {
  id: number
  name: string
  type: string
}

export type WrapperDynamicColumnsProps = {
  initialColumns?: Pick<SimpleColumn, 'name' | 'type'>[]
  onChange?: (columns: SimpleColumn[]) => void
  errors?: any
}

const DEFAULT_INITIAL_COLUMNS: WrapperDynamicColumnsProps['initialColumns'] = [
  { name: '', type: 'text' },
]

type State = {
  columns: {
    [key: number]: SimpleColumn
  }
  nextId: number
}

type Action =
  | {
      type: 'ADD_COLUMN'
    }
  | {
      type: 'REMOVE_COLUMN'
      payload: {
        id: number
      }
    }
  | {
      type: 'UPDATE_COLUMN'
      payload: {
        id: number
        key: keyof SimpleColumn
        value: string
      }
    }

const WrapperDynamicColumns = ({
  initialColumns = DEFAULT_INITIAL_COLUMNS,
  onChange,
  errors = {},
}: WrapperDynamicColumnsProps) => {
  const [state, dispatch] = useReducer(
    (state: State, action: Action) => {
      switch (action.type) {
        case 'ADD_COLUMN':
          return {
            ...state,
            columns: {
              ...state.columns,
              [state.nextId]: { id: state.nextId, name: '', type: 'text' },
            },
            nextId: state.nextId + 1,
          }
        case 'REMOVE_COLUMN':
          return {
            ...state,
            columns: Object.fromEntries(
              Object.entries(state.columns).filter(([key]) => Number(key) !== action.payload.id)
            ),
          }
        case 'UPDATE_COLUMN':
          return {
            ...state,
            columns: {
              ...state.columns,
              [action.payload.id]: {
                ...state.columns[action.payload.id],
                [action.payload.key]: action.payload.value,
              },
            },
          }
        default:
          return state
      }
    },
    {
      columns: Object.fromEntries(
        initialColumns.map((column, index) => [index, { ...column, id: index }])
      ),
      nextId: initialColumns.length,
    }
  )

  const onChangeRef = useLatest(onChange)
  useEffect(() => {
    onChangeRef.current?.(getColumns(state.columns))
  }, [state.columns])

  const onAddColumn = () => {
    dispatch({ type: 'ADD_COLUMN' })
  }

  const onRemoveColumn = (id: number) => {
    dispatch({ type: 'REMOVE_COLUMN', payload: { id } })
  }

  const onUpdateValue = (id: number, key: keyof SimpleColumn, value: string) => {
    dispatch({ type: 'UPDATE_COLUMN', payload: { id, key, value } })
  }

  const columns = getColumns(state.columns)

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        {columns.map((column, idx) => (
          <div key={column.id} className="flex flex-col">
            <div className="flex items-center gap-2">
              <Input
                className="flex-1 [&_label]:!p-0"
                layout="vertical"
                label="Name"
                value={column.name}
                onChange={(e) => onUpdateValue(column.id, 'name', e.target.value)}
              />

              <div className="flex-1">
                <ColumnType
                  value={column.type}
                  enumTypes={[]}
                  onOptionSelect={(value) => onUpdateValue(column.id, 'type', value)}
                  layout="vertical"
                  className="[&_label]:!p-0"
                />
              </div>

              <Button
                type="outline"
                icon={<X strokeWidth={1.5} />}
                onClick={() => onRemoveColumn(column.id)}
                className="self-end -translate-y-1.5 px-1.5"
              />
            </div>

            {errors[`columns.${idx}`] && (
              <span className="text-red-900 text-sm mt-2">{errors[`columns.${idx}`]}</span>
            )}
          </div>
        ))}
      </div>

      <Button type="default" onClick={() => onAddColumn()} className="self-start">
        Add column
      </Button>
    </div>
  )
}

export default WrapperDynamicColumns

function getColumns(columns: State['columns']) {
  return Object.values(columns).sort((a, b) => a.id - b.id)
}
