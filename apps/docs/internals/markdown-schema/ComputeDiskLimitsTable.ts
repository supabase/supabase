import { createRequire } from 'node:module'

// tsx's ESM loader can't pick up named exports from the `shared-data` package
// (CJS, no `"type": "module"`). Load via `createRequire` for CJS interop —
// this file only runs in the build script, never in the Next.js bundle.
const {
  COMPUTE_BASELINE_IOPS,
  COMPUTE_BASELINE_THROUGHPUT,
  COMPUTE_DISK,
  COMPUTE_MAX_IOPS,
  COMPUTE_MAX_THROUGHPUT,
} = createRequire(import.meta.url)('shared-data') as {
  COMPUTE_BASELINE_IOPS: Record<string, number>
  COMPUTE_BASELINE_THROUGHPUT: Record<string, number>
  COMPUTE_DISK: Record<string, { name: string }>
  COMPUTE_MAX_IOPS: Record<string, number>
  COMPUTE_MAX_THROUGHPUT: Record<string, number>
}

export const ComputeDiskLimitsTable = (): string => `
| Compute Instance | Baseline Throughput (MB/s) | Max Throughput (MB/s) | Baseline IOPS | Max IOPS |
| --- | --- | --- | --- | --- |
${Object.entries(COMPUTE_DISK)
  .map(
    ([key, value]) =>
      `| ${value.name} | ${COMPUTE_BASELINE_THROUGHPUT[key]?.toLocaleString()} MB/s | ${COMPUTE_MAX_THROUGHPUT[key]?.toLocaleString()} MB/s | ${COMPUTE_BASELINE_IOPS[key]?.toLocaleString()} IOPS | ${COMPUTE_MAX_IOPS[key]?.toLocaleString()} IOPS |`
  )
  .join('\n')}
`
