import { FC } from 'react'
import { isUndefined, includes } from 'lodash'
import { Button, Select, Input, IconLink, IconArrowRight, IconEdit2 } from 'ui'

import { RowField } from './RowEditor.types'
import DateTimeInput from './DateTimeInput'
import { TEXT_TYPES, JSON_TYPES, DATETIME_TYPES } from '../SidePanelEditor.constants'
import MultiSelect from 'components/ui/MultiSelect'
import { convertPgArrayToJsArray, convertJsArraytoPgArray, uuidv4 } from 'lib/helpers'

interface Props {
  field: RowField
  errors: any
  isEditable?: boolean
  onUpdateField?: (changes: object) => void
  onEditJson?: (data: any) => void
  onViewForeignKey?: () => void
}

const InputField: FC<Props> = ({
  field,
  errors,
  isEditable = true,
  onUpdateField = () => {},
  onEditJson = () => {},
  onViewForeignKey = () => {},
}) => {
  if (field.enums.length > 0) {
    const isArray = field.format[0] === '_'

    if (isArray) {
      const formattedValue = convertPgArrayToJsArray(field?.value ?? '')
      const options = field.enums.map((value: string) => {
        return { id: uuidv4(), value, name: value, disabled: false }
      })
      return (
        <div className="grid gap-x-2 md:grid-cols-12 md:gap-x-4">
          <div className="col-span-4">
            <label className="block text-scale-1100 text-sm break-all">{field.name}</label>
            <span className="text-scale-900 text-sm" id="-optional">
              {field.format}
            </span>
          </div>
          <div className="col-span-8">
            <MultiSelect
              allowDuplicateSelection
              options={options}
              value={formattedValue}
              searchPlaceholder="Search for a value"
              placeholder="NULL"
              error={errors[field.name]}
              onChange={(values) => {
                const formattedValues = convertJsArraytoPgArray(values)
                onUpdateField({ [field.name]: formattedValues })
              }}
            />
          </div>
        </div>
      )
    } else {
      return (
        <Select
          size="medium"
          layout="horizontal"
          value={field.value ?? ''}
          label={field.name}
          labelOptional={field.format}
          descriptionText={field.comment}
          disabled={!isEditable}
          error={errors[field.name]}
          onChange={(event: any) => onUpdateField({ [field.name]: event.target.value })}
        >
          <Select.Option value="">---</Select.Option>
          {field.enums.map((value: string) => (
            <Select.Option key={value} value={value}>
              {value}
            </Select.Option>
          ))}
        </Select>
      )
    }
  }

  if (!isUndefined(field.foreignKey)) {
    return (
      <Input
        layout="horizontal"
        label={field.name}
        value={field.value ?? ''}
        // @ts-ignore This is creating some validateDOMNesting errors
        // because descriptionText is a <p> element as a parent
        descriptionText={
          <div className="flex items-center space-x-1 opacity-50">
            {field.comment && <p className="text-sm">{field.comment}</p>}
            <p className="text-sm">({field.name}</p>
            <p className="text-sm">
              <IconArrowRight size={14} strokeWidth={2} />
            </p>
            <p className="text-sm">
              {field.foreignKey.target_table_schema}.{field.foreignKey.target_table_name}.
              {field.foreignKey.target_column_name})
            </p>
          </div>
        }
        labelOptional={field.format}
        disabled={!isEditable}
        error={errors[field.name]}
        onChange={(event: any) => onUpdateField({ [field.name]: event.target.value })}
        actions={
          <Button
            disabled={field.value === null || field.value?.length === 0}
            type="default"
            htmlType="button"
            onClick={onViewForeignKey}
            icon={<IconLink />}
          >
            View data
          </Button>
        }
      />
    )
  }

  if (includes(TEXT_TYPES, field.format)) {
    return (
      <div className="text-area-text-sm">
        <Input.TextArea
          layout="horizontal"
          label={field.name}
          className="text-sm"
          descriptionText={field.comment}
          labelOptional={field.format}
          disabled={!isEditable}
          error={errors[field.name]}
          rows={5}
          value={field.value ?? ''}
          placeholder={
            field.defaultValue === null
              ? ''
              : typeof field.defaultValue === 'string' && field.defaultValue.length === 0
              ? 'Default: Empty string'
              : `Default: ${field.defaultValue}`
          }
          onChange={(event: any) => onUpdateField({ [field.name]: event.target.value })}
        />
      </div>
    )
  }

  if (includes(JSON_TYPES, field.format)) {
    return (
      <Input
        layout="horizontal"
        value={field.value ?? ''}
        label={field.name}
        descriptionText={field.comment}
        labelOptional={field.format}
        disabled={!isEditable}
        placeholder={field?.defaultValue ?? ''}
        error={errors[field.name]}
        onChange={(event: any) => onUpdateField({ [field.name]: event.target.value })}
        actions={
          <Button
            type="default"
            htmlType="button"
            onClick={() => onEditJson({ column: field.name, jsonString: field.value })}
            icon={<IconEdit2 />}
          >
            Edit JSON
          </Button>
        }
      />
    )
  }

  if (includes(DATETIME_TYPES, field.format)) {
    return (
      <DateTimeInput
        name={field.name}
        format={field.format}
        value={field.value ?? ''}
        description={field.comment}
        onChange={(value: any) => onUpdateField({ [field.name]: value })}
      />
    )
  }

  return (
    <Input
      layout="horizontal"
      label={field.name}
      descriptionText={field.comment}
      labelOptional={field.format}
      error={errors[field.name]}
      value={field.value ?? ''}
      placeholder={
        field.isIdentity
          ? 'Automatically generated as identity'
          : field.defaultValue !== null
          ? `Default: ${field.defaultValue}`
          : ''
      }
      disabled={!isEditable}
      onChange={(event: any) => onUpdateField({ [field.name]: event.target.value })}
    />
  )
}

export default InputField
