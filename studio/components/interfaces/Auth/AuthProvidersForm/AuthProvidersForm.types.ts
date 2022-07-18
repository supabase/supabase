export interface Enum {
  label: string
  value: string
  icon: string
}

export interface Provider {
  $schema: string
  type: 'object'
  title: string
  properties: {
    [x: string]: {
      title: string
      type: 'boolean' | 'string' | 'select' | 'number'
      description?: string
      descriptionOptional?: string
      units?: string
      enum: Enum[]
      show: {
        key: string
        matches: string
      }
    }
  }
  validationSchema: any // todo: use Yup type
  misc: {
    iconKey: 'gitlab-icon'
    requiresRedirect: true
    helper: string
    alert: {
      title: string
      description: string
    }
  }
}
