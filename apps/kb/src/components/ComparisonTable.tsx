import { profiles as allProfiles } from '../lib/comparisons'
import { buildComparisonTable, type RowKey } from '../lib/comparisons/table'
import type { CompetitorProfile } from '../lib/comparisons/types'

export interface ComparisonTableProps {
  /** Vendors to show, in column order. Defaults to every profile. */
  profiles?: CompetitorProfile[]
  /** Characteristics to show, in row order. Defaults to all of them. */
  rows?: RowKey[]
}

// Renders the per-vendor comparison from the profile data. Notes appear as
// numbered footnotes below the table, so cells stay short.
export const ComparisonTable = ({ profiles = allProfiles, rows }: ComparisonTableProps) => {
  const table = buildComparisonTable(profiles, rows)

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto">
        <table className="w-full min-w-max border-collapse text-left text-sm">
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky left-0 z-10 border-b bg-background px-3 py-2 font-medium text-foreground-light"
              />
              {table.profileNames.map((name) => (
                <th
                  key={name}
                  scope="col"
                  className="border-b px-3 py-2 font-medium text-foreground"
                >
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => (
              <tr key={row.label}>
                <th
                  scope="row"
                  className="sticky left-0 z-10 border-b bg-background px-3 py-2 align-top font-medium text-foreground-light"
                >
                  {row.label}
                </th>
                {row.cells.map((cell, index) => (
                  <td
                    key={table.profileNames[index]}
                    className="border-b px-3 py-2 align-top text-foreground"
                  >
                    {cell.text}
                    {cell.footnote !== undefined && (
                      <sup className="ml-0.5 text-foreground-light">
                        <a href={`#comparison-note-${cell.footnote}`}>{cell.footnote}</a>
                      </sup>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {table.footnotes.length > 0 && (
        <ol className="flex list-none flex-col gap-2 text-sm text-foreground-light">
          {table.footnotes.map((footnote) => (
            <li key={footnote.number} id={`comparison-note-${footnote.number}`}>
              <span className="text-foreground">{footnote.number}.</span> {footnote.notes}
              {footnote.sourcing_urls.length > 0 && (
                <span>
                  {' '}
                  Sources:{' '}
                  {footnote.sourcing_urls.map((url, index) => (
                    <span key={url}>
                      {index > 0 && ', '}
                      <a href={url} target="_blank" rel="noreferrer" className="underline">
                        {url}
                      </a>
                    </span>
                  ))}
                </span>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
