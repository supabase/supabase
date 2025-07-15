import { useWarehouseQueryQuery } from './warehouse-query'

export function useWarehouseLogDetailQuery({
  ref,
  collectionName,
  logId,
  columns = ['id', 'timestamp'],
}: {
  ref: string
  collectionName?: string
  logId?: string
  columns?: string[]
}) {
  const enabled = !!logId && !!collectionName
  const sql = `select ${columns.join(',')} from \`${collectionName}\`
    where id = '${logId}' and timestamp > '2024-01-01' limit 1`

  return useWarehouseQueryQuery({ ref, sql }, { enabled })
}
