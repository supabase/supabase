import Papa from 'papaparse'

export const formatRowsForCSV = ({ rows, columns }: { rows: any[]; columns: string[] }) => {
  const formattedRows = rows.map((row) => {
    const formattedRow = row
    Object.keys(row).map((column) => {
      if (typeof row[column] === 'object' && row[column] !== null)
        formattedRow[column] = JSON.stringify(formattedRow[column])
    })
    return formattedRow
  })
  const csv = Papa.unparse(formattedRows, { columns })
  return csv
}
