import Link from 'next/link'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'

import { getAllTroubleshootingEntries, getArticleSlug } from './Troubleshooting.utils'

interface TroubleshootingErrorsTableProps {
  filters?: {
    topics?: string[]
    keywords?: string[]
  }
}

export async function TroubleshootingErrorsTable({
  filters,
}: TroubleshootingErrorsTableProps = {}) {
  const troubleshootingEntries = await getAllTroubleshootingEntries()
  const filteredEntries = troubleshootingEntries.filter((entry) => {
    if ((entry.data.errors?.length ?? 0) === 0) return false

    const topicFiltersLength = filters?.topics?.length ?? 0
    const keywordFiltersLength = filters?.keywords?.length ?? 0
    if (topicFiltersLength === 0 && keywordFiltersLength === 0) return true

    if (filters?.topics?.length > 0) {
      if (filters.topics.some((topic) => entry.data.topics?.includes(topic))) return true
    }
    if (filters?.keywords?.length > 0) {
      if (filters.keywords.some((keyword) => entry.data.keywords?.includes(keyword))) return true
    }
    return false
  })

  if (filteredEntries.length === 0) {
    return null
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Error</TableHead>
          <TableHead>More information</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredEntries.flatMap((entry) =>
          entry.data.errors.map((error) => (
            <TableRow key={entry.data.database_id}>
              <TableCell className="flex items-center gap-1">
                {error.code && <code>{error.code}</code>}
                {error.message}
              </TableCell>
              <TableCell>
                <Link href={`/guides/troubleshooting/${getArticleSlug(entry)}`}>
                  Troubleshooting
                </Link>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
