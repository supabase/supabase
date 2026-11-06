export interface PageInfo {
  pageId: number
  path: string
  checksum: string
  sectionsCount: number
}

export interface PageSectionForEmbedding {
  pageId: number
  path: string
  slug?: string
  heading?: string
  content: string
  input: string
  ragIgnore: boolean
}

export interface PageSectionWithEmbedding extends PageSectionForEmbedding {
  embedding: number[]
}

export interface ProcessingResult {
  successfulPages: Set<number>
  failedPages: Set<number>
  totalSectionsProcessed: number
  totalSectionsInserted: number
}

export function createBatches<T>(array: T[], batchSize: number): T[][] {
  const batches: T[][] = []
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize))
  }
  return batches
}

export function mapEmbeddingsToSections(
  batch: PageSectionForEmbedding[],
  data: Array<{ embedding?: number[] }>,
  batchNumber: number
): {
  sectionsWithEmbeddings: PageSectionWithEmbedding[]
  failedSectionIndexes: Set<number>
} {
  const sectionsWithEmbeddings: PageSectionWithEmbedding[] = []
  const failedSectionIndexes: Set<number> = new Set()

  if (batch.length !== data.length) {
    console.error(
      `Ignoring all embeddings returned from batch ${batchNumber} because returned number doesn't match input number`
    )
    batch.forEach((_, index) => {
      failedSectionIndexes.add(index)
    })
  }

  for (let i = 0; i < batch.length; i++) {
    if (data[i].embedding) {
      sectionsWithEmbeddings.push({ ...batch[i], embedding: data[i].embedding! })
    } else {
      failedSectionIndexes.add(i)
    }
  }

  return { sectionsWithEmbeddings, failedSectionIndexes }
}

export function updatePageInsertionCounts(
  pageSectionsInserted: Map<number, number>,
  sectionsWithEmbeddings: PageSectionWithEmbedding[]
) {
  sectionsWithEmbeddings.forEach((section) => {
    const current = pageSectionsInserted.get(section.pageId) || 0
    pageSectionsInserted.set(section.pageId, current + 1)
  })
}

export function computePageResults(
  pageInfoMap: Map<number, PageInfo>,
  pageSectionsInserted: Map<number, number>,
  result: ProcessingResult
) {
  for (const [pageId, pageInfo] of pageInfoMap) {
    const insertedCount = pageSectionsInserted.get(pageId) || 0
    if (insertedCount === pageInfo.sectionsCount && !result.failedPages.has(pageId)) {
      result.successfulPages.add(pageId)
    } else {
      result.failedPages.add(pageId)
      console.warn(
        `Page ${pageInfo.path}: inserted ${insertedCount}/${pageInfo.sectionsCount} sections`
      )
    }
  }
}

export function logFailedSections(
  batch: PageSectionForEmbedding[],
  inputs: string[],
  failedSectionIndexes: Set<number>
) {
  failedSectionIndexes.forEach((i) => {
    console.error(
      `Failed to process section: ${batch[i].path}#${batch[i].slug} (content: "${inputs[i]?.slice(0, 50)}...")`
    )
  })
}
