import {
  COMPUTE_LABELS,
  THROUGHPUT_TABLE_HEADINGS,
} from '../../components/RealtimeLimitsEstimator/RealtimeLimitsEstimator.constants'
import throughputTable from '../../data/realtime/throughput.json'

type Row = {
  computeAddOn: string
  filters: boolean
  rls: boolean
  concurrency: number
  maxDBChanges: number
  maxMessagesPerClient: number
  totalMessagesPerSecond: number
  p95Latency: number
}

const headerRow = `| ${THROUGHPUT_TABLE_HEADINGS.join(' | ')} |`
const dividerRow = `| ${THROUGHPUT_TABLE_HEADINGS.map(() => '---').join(' | ')} |`

const renderGroup = (computeAddOn: string): string => {
  const rows = (throughputTable as Row[]).filter((l) => l.computeAddOn === computeAddOn)
  return `#### ${COMPUTE_LABELS[computeAddOn] ?? computeAddOn}

${headerRow}
${dividerRow}
${rows
  .map(
    (l) =>
      `| ${l.filters ? 'Yes' : 'No'} | ${l.rls ? 'Yes' : 'No'} | ${l.concurrency.toLocaleString()} | ${l.maxDBChanges} | ${l.maxMessagesPerClient} | ${l.totalMessagesPerSecond.toLocaleString()} | ${l.p95Latency}ms |`
  )
  .join('\n')}`
}

export const RealtimeLimitsEstimator = (): string =>
  [...new Set((throughputTable as Row[]).map((l) => l.computeAddOn))].map(renderGroup).join('\n\n')
