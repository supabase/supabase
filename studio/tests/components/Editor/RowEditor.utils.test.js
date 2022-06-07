import { validateFields } from 'components/interfaces/TableGridEditor/SidePanelEditor/RowEditor/RowEditor.utils'

describe('RowEditor.utils: validateFields', () => {
  test('should non-nullable fields correctly', () => {
    const mockFields = [
      {
        name: 'name',
        value: '',
        format: 'text',
        defaultValue: null,
        isNullable: false,
      },
      {
        name: 'number',
        value: 0,
        format: 'text',
        defaultValue: null,
        isNullable: false,
      },
    ]
    const res = validateFields(mockFields)
    console.log('res', res)
    expect(res).toHaveProperty('name')
  })
})
