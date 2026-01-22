import { TableRowsData } from '@/data/table-rows/table-rows-query'
import { Dictionary } from '@/types'
import { QueryKey } from '@tanstack/react-query'

export type RowIdentifiers = Dictionary<string | number | boolean | null>

export type OptimisticUpdateContext = {
  previousRowsQueries: [QueryKey, TableRowsData | undefined][]
}
