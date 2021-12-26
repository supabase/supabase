// @ts-ignore
import MarkdownTable from 'markdown-table'

export const getResultsMarkdown = (results: any[]) => {
  const columns = Object.keys(results[0])
  const rows = results.map((x: any) => {
    const temp: any[] = []
    columns.forEach((col) => temp.push(x[col]))
    return temp
  })
  const table = [columns].concat(rows)
  return MarkdownTable(table)
}
