export interface Enum {
  label: string
  value: string
  icon: string
}

export interface Provider {
  $schema: string
  type: 'object'
  title: string
  link: string
  properties: {
    [x: string]: {
      title: string
      type: 'boolean' | 'string' | 'select' | 'number'
      enum: Enum[]
      show: {
        key: string
        matches: string
      }
      description?: string
      descriptionOptional?: string
      units?: string
      isSecret?: boolean
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
