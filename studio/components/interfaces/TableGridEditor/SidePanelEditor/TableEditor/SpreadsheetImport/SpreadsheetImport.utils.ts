import Papa from 'papaparse'

const CHUNK_SIZE = 1024 * 1024 * 0.25 // 0.25MB

export const parseSpreadsheetText: any = (text: string) => {
  return new Promise((resolve) => {
    Papa.parse(text, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields
        const rows = results.data
        const errors = results.errors
        resolve({ headers, rows, errors })
      },
    })
  })
}

/**
 * For SpreadsheetImport side panel
 * @param file File object (CSV or TSV)
 * @returns {Object<headers, rows, errors>}
 * headers: String[]
 * rows: any[]
 * errors: Object[]
 */
export const parseSpreadsheet = (file: File, onProgressUpdate: (progress: number) => void): any => {
  let headers: string[] = []
  let chunkNumber = 0
  let rowCount = 0
  const rowPreview: any[] = []
  const errors: any[] = []
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      worker: true,
      quoteChar: file.type === 'text/tab-separated-values' ? '' : '"',
      chunkSize: CHUNK_SIZE,
      chunk: (results) => {
        headers = results.meta.fields as string[]

        if (rowCount === 0) {
          rowPreview.push(...results.data.slice(0, 50))
        }

        rowCount += results.data.length

        if (results.errors.length > 0) {
          errors.push(...results.errors)
        }

        chunkNumber += 1
        const progress = (chunkNumber * CHUNK_SIZE) / file.size
        onProgressUpdate(progress > 1 ? 100 : Number((progress * 100).toFixed(2)))
      },
      complete: () => {
        const data = { headers, rowCount, rowPreview, errors }
        resolve(data)
      },
    })
  })
}

export const revertSpreadsheet = (headers: string[], rows: any[]) => {
  return Papa.unparse(rows, { columns: headers })
}
