import { ChangeEvent, useState } from 'react'
import {
  Checkbox,
  Select,
  Divider,
  Input,
  Button,
  IconPlus,
  SidePanel,
  Typography,
} from '@supabase/ui'

import { createTable } from '../../lib/api'

type NewTableFormProps = {
  visible: boolean
  setVisible: (v: boolean) => void
}

const dataTypes = ['', 'int2', 'int4', 'int8', 'text', 'uuid']

export default function NewTableForm({ visible, setVisible }: NewTableFormProps) {
  const [includePrimaryKey, setIncludePrimaryKey] = useState(true)
  const [tableName, setTableName] = useState('')
  const [comment, setComment] = useState('')
  const [primaryKey, setPrimaryKey] = useState('id')
  const [dataType, setDataType] = useState('')
  const [isIdentity, setIsIdentity] = useState(true)
  const [errors, setErrors] = useState([])

  const handleIdentitySelect = (e: ChangeEvent<HTMLSelectElement>) => {
    setIsIdentity(!!e.target.value)
  }

  const handleSave = async () => {
    if (!tableName) {
      return alert('Table name is required')
    }

    if (includePrimaryKey && !dataType) {
      return alert('Data type is required for primary key')
    }

    if (includePrimaryKey && !primaryKey) {
      return alert('primary key name is required if Include primary key is selected')
    }

    const newTable = {
      name: tableName,
      comment,
      primaryKey: {
        name: primaryKey,
        type: dataType,
        isPrimaryKey: includePrimaryKey,
        isIdentity,
        defaultValueFormat: 'literal',
      },
    }

    try {
      const result = await createTable(newTable)
      setVisible(false)
    } catch (error) {
      alert(error.message)
    }
  }

  return (
    <SidePanel
      wide
      align="right"
      visible={visible}
      title="Add new table"
      onCancel={() => setVisible(!visible)}
      onConfirm={handleSave}
      confirmText="Save"
    >
      <Input
        value={tableName}
        onChange={(e) => setTableName(e.target.value)}
        label="Name"
        layout="horizontal"
        className="mb-8"
      />
      <Input
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        label="Description"
        placeholder="Optional"
        layout="horizontal"
      />
      <Divider className="my-8" />
      <div className="flex flex-col">
        <Typography.Title level={5}>Add existing content to new table</Typography.Title>
        <Typography.Text type="secondary">
          Upload a CSV or TSV file, or paste copied text from a spreadsheet.
        </Typography.Text>
        <Button className="my-4" icon={<IconPlus />} type="secondary">
          Add existing content
        </Button>
      </div>
      <Divider className="my-4" />
      <div>
        <Checkbox
          checked={includePrimaryKey}
          onChange={() => setIncludePrimaryKey(!includePrimaryKey)}
          label="Include primary key"
          description="indicates that a column in your table can be the unique identifier for rows in the table"
        />
        {includePrimaryKey && (
          <>
            <Input
              value={primaryKey}
              onChange={(e) => setPrimaryKey(e.target.value)}
              label="Name"
              className="mt-8"
              layout="horizontal"
            />
            <Select
              value={dataType}
              label="Type"
              onChange={(e) => setDataType(e.target.value)}
              layout="horizontal"
              className="my-6"
            >
              {dataTypes.map((option, i) => (
                <Select.Option key={`type-option-${i}`} value={option}>
                  {option ? option : '---'}
                </Select.Option>
              ))}
            </Select>
            <Select
              label="Default Value"
              onChange={handleIdentitySelect}
              layout="horizontal"
              className="my-6"
            >
              <Select.Option value="">---</Select.Option>
              <Select.Option selected value="Automatically generate as identity">
                Automatically generate as identity
              </Select.Option>
            </Select>
          </>
        )}
      </div>
    </SidePanel>
  )
}
