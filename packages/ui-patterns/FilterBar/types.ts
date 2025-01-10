export type FilterProperty = {
  label: string
  name: string
  type: 'string' | 'number' | 'date' | 'boolean'
  options?: string[] | ((search?: string) => Promise<string[]>) | ((search?: string) => string[])
  operators?: string[]
}

export type FilterCondition = {
  propertyName: string
  value: string | number | boolean | Date | null
  operator: string
}

export type FilterGroup = {
  logicalOperator: 'AND' | 'OR'
  conditions: Array<FilterCondition | FilterGroup>
}
