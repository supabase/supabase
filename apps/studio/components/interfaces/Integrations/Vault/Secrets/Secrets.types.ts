export interface SecretTableColumn {
  id: 'secret' | 'id' | 'secret_value' | 'updated_at' | 'actions'
  name: string
  minWidth?: number
  width?: number
  maxWidth?: number
}
