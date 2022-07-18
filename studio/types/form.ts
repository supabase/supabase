interface Enum {
  label: string
  value: string
  icon: string
}

export interface FormSchema {
  $schema: string
  id?: string
  type: 'object'
  title: string
  properties: {
    [x: string]: {
      title: string
      type: 'boolean' | 'string' | 'select' | 'number' | 'code'
      description?: string
      descriptionOptional?: string
      enum?: Enum[]
      show?: {
        key: string
        matches: string
      }
    }
  }
  validationSchema: any // todo: use Yup type
  misc?: {
    iconKey?: string
    requiresRedirect?: true
    helper?: string
    alert?: {
      title?: string
      description?: string
    }
  }
}
