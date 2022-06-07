import { validateFields } from 'components/interfaces/TableGridEditor/SidePanelEditor/RowEditor/RowEditor.utils'

describe('RowEditor.utils: validateFields', () => {
  test('should validate for non-nullable fields correctly', () => {
    const mockFields = [
      {
        name: 'name',
        value: '',
        format: 'text',
        defaultValue: null,
        isNullable: false,
      },
      {
        name: 'age',
        value: 0,
        format: 'int8',
        defaultValue: null,
        isNullable: false,
      },
      {
        name: 'height',
        value: '',
        format: 'int2',
        defaultValue: null,
        isNullable: false,
      },
      {
        name: 'weight',
        value: '',
        format: 'int2',
        defaultValue: null,
        isNullable: true,
      },
    ]
    const res = validateFields(mockFields)
    expect(res).toHaveProperty('name')
    expect(res).not.toHaveProperty('age')
    expect(res).toHaveProperty('height')
    expect(res).not.toHaveProperty('weight')
  })
})
