import { SupaRow } from './table'

export interface GridProps {
  width?: string | number
  height?: string | number
  defaultColumnWidth?: string | number
  containerClass?: string
  gridClass?: string
  rowClass?: ((row: SupaRow) => string | undefined) | undefined
}
