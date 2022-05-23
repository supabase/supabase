import { unescapeLiteral } from 'components/interfaces/TableGridEditor/SidePanelEditor/ColumnEditor/ColumnEditor.utils'

describe('ColumnEditor.utils: unescapeLiteral', () => {
  test('should return varchar properly', () => {
    const mockInput = "'potato'::character varying"
    const value = unescapeLiteral(mockInput)
    expect(value).toStrictEqual('potato')
  })
  test('should return text properly', () => {
    const mockInput = "'tomato'::text"
    const value = unescapeLiteral(mockInput)
    expect(value).toStrictEqual('tomato')
  })
  test('should return numerical arrays properly', () => {
    const mockInput = "'{1,2,3,4}'::integer[]"
    const value = unescapeLiteral(mockInput)
    expect(value).toStrictEqual('[1,2,3,4]')
  })
  test('should return string arrays properly', () => {
    const mockInput = "'{apple,orange}'::text[]"
    const value = unescapeLiteral(mockInput)
    expect(value).toStrictEqual('["apple","orange"]')
  })
  test('should return single word functions as they are', () => {
    const mockInput = 'uuid_generate_v4()'
    const value = unescapeLiteral(mockInput)
    expect(value).toStrictEqual(mockInput)
  })
  test('should return functions beyond one word properly', () => {
    const mockInput = "(now() AT TIME ZONE 'utc'::text)"
    const value = unescapeLiteral(mockInput)
    expect(value).toStrictEqual("(now() at time zone 'utc')")
  })
  test('should return json object properly', () => {
    const mockInput = `'{\"version\": 10, \"dimensions\": {\"width\": 50, \"height\": 20}}'::jsonb`
    const value = unescapeLiteral(mockInput)
    expect(value).toStrictEqual('{"version": 10, "dimensions": {"width": 50, "height": 20}}')
  })
  test('should return json array properly', () => {
    const mockInput = `'[{\"version\": 10}, {\"version\": 11}]'::jsonb`
    const value = unescapeLiteral(mockInput)
    expect(value).toStrictEqual('[{"version": 10}, {"version": 11}]')
  })
})
