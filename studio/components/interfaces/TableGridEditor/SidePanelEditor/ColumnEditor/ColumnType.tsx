import React, { FC } from 'react'
import {
  IconCalendar,
  IconType,
  IconHash,
  Listbox,
  Typography,
  IconToggleRight,
} from '@supabase/ui'
import { POSTGRES_DATA_TYPE_OPTIONS } from '../SidePanelEditor.constants'
import { PostgresDataTypeOption, EnumType } from '../SidePanelEditor.types'

interface Props {
  value: string
  enumTypes: EnumType[]
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge'
  className?: string
  error?: any
  disabled?: boolean
  showLabel?: boolean
  onOptionSelect: (value: string) => void
}

const ColumnType: FC<Props> = ({
  value,
  enumTypes = [],
  className,
  size = 'medium',
  error,
  disabled = false,
  showLabel = true,
  onOptionSelect = () => {},
}) => {
  const inferIcon = (type: string) => {
    switch (type) {
      case 'number':
        return <IconHash size={16} className="text-green-600" strokeWidth={2} />
      case 'time':
        return <IconCalendar size={16} className="text-green-600" strokeWidth={2} />
      case 'text':
        return <IconType size={16} className="text-green-600" strokeWidth={2} />
      case 'json':
        return (
          <div className="text-green-600" style={{ padding: '0px 1px' }}>
            {'{ }'}
          </div>
        )
      case 'bool':
        return <IconToggleRight size={16} className="text-green-600" strokeWidth={2} />
      default:
        return <div />
    }
  }

  return (
    <Listbox
      label={showLabel ? 'Type' : ''}
      layout={showLabel ? 'horizontal' : 'vertical'}
      value={value}
      size={size}
      error={error}
      className={`${className} ${disabled ? 'column-type-disabled' : ''}`}
      onChange={(value: string) => onOptionSelect(value)}
    >
      <Listbox.Option key="empty" value="" label="---">
        ---
      </Listbox.Option>

      <Listbox.Option disabled key="header-1" value="header-1" label="header-1">
        User-defined Enumerated Types
      </Listbox.Option>

      {enumTypes.length > 0 ? (
        enumTypes.map((enumType: EnumType) => (
          <Listbox.Option
            key={enumType.name}
            value={enumType.name}
            label={enumType.name}
            addOnBefore={() => {
              return <div className="mx-1 w-2 h-2 rounded-full bg-green-700" />
            }}
          >
            <div className="flex items-center space-x-4">
              <p>{enumType.name}</p>
            </div>
          </Listbox.Option>
        ))
      ) : (
        <Listbox.Option
          disabled
          key="no-enums"
          value="no-enums"
          label="no-enums"
          addOnBefore={() => {
            return <div className="mx-1 w-2 h-2 rounded-full bg-gray-500" />
          }}
        >
          <div className="flex items-center space-x-4">
            <p>No enumerated types available</p>
          </div>
        </Listbox.Option>
      )}

      <Listbox.Option disabled value="header-2" label="header-2">
        PostgreSQL Data Types
      </Listbox.Option>

      {POSTGRES_DATA_TYPE_OPTIONS.map((option: PostgresDataTypeOption) => (
        <Listbox.Option
          key={option.name}
          value={option.name}
          label={option.name}
          addOnBefore={() => inferIcon(option.type)}
        >
          <div className="flex items-center space-x-4">
            <Typography.Text>
              <p>{option.name}</p>
            </Typography.Text>
            <p>
              <Typography.Text small className="opacity-50">
                {option.description}
              </Typography.Text>
            </p>
          </div>
        </Listbox.Option>
      ))}
    </Listbox>
  )
}

export default ColumnType
