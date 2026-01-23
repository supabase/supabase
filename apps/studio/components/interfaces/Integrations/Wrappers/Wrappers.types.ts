export type WrapperMeta = {
  name: string
  handlerName: string
  validatorName: string
  icon: string
  /** Short description (one-sentence) used in lists of integrations  */
  description: string
  extensionName: string
  label: string
  server: Server
  docsUrl: string
  minimumExtensionVersion?: string
  customComponent?: boolean
  // If true, the wrapper can target a schema which will be populated with tables specified by the wrapper..
  canTargetSchema?: boolean
  sourceSchemaOption?: ServerOption
  // Array of tables that needs to be supplied to the wrapper. If the array is empty, the wrapper should target a schema.
  tables: Table[]
}

export type ServerOption = {
  name: string
  label: string
  description?: string
  required: boolean
  encrypted: boolean
  secureEntry: boolean
  hidden?: boolean
  isTextArea?: boolean
  urlHelper?: string
  defaultValue?: string
  readOnly?: boolean
}

export type Server = {
  options: ServerOption[]
}

export type TableOption =
  | {
      name: string
      defaultValue?: string
      editable: boolean
      required: boolean
      label?: string
      placeholder?: string
      type: 'text'
    }
  | {
      name: string
      defaultValue?: string
      editable: boolean
      required: boolean
      label?: string
      type: 'select'
      options: {
        label: string
        value: string
      }[]
    }

export type Table = {
  label: string
  description?: string
  availableColumns?: AvailableColumn[]
  options: TableOption[]
}

export type AvailableColumn = {
  name: string
  type: string
}
