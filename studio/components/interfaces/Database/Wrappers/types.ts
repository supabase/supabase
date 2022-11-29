export type Wrapper = {
  name: string
  extensionName: string
  label: string
  server: Server
  tables: Table[]
}

export type ServerOption = {
  name: string
  label: string
  required: boolean
  encrypted: boolean
  defaultValue?: string
}

export type Server = {
  name: string
  options: ServerOption[]
}

export type TableOption = {
  name: string
  defaultValue?: string
  editable: boolean
  required: boolean
  label?: string
  placeholder?: string
}

export type Table = {
  label: string
  availableColumns: AvailableColumn[]
  options: TableOption[]
}

export type AvailableColumn = {
  name: string
  type: string
}
