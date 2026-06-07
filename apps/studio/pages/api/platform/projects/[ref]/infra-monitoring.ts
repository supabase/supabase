import { execFile } from 'child_process'
import os from 'os'
import { NextApiRequest, NextApiResponse } from 'next'
import { promisify } from 'util'

const execFileP = promisify(execFile)

// [console fork] GET /platform/projects/{ref}/infra-monitoring
// Supabase sources these from an instance metrics pipeline (node-exporter/Prometheus)
// we don't run. On shared infra we read REAL current usage from `docker stats` for
// the project's containers and return a flat series across the requested window so the
// Observability/Infrastructure charts render real numbers instead of "Unable to load data".
// Rate-based metrics we can't sample cheaply (IOPS, network/disk throughput, swap) return 0.

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: { message: `Method ${req.method} Not Allowed` } })
  }
  return handleGet(req, res)
}

function parseBytes(s: string | undefined): number {
  if (!s) return 0
  const m = s.trim().match(/^([\d.]+)\s*([KMGTP]?i?B)?$/i)
  if (!m) return 0
  const n = parseFloat(m[1])
  const unit = (m[2] || 'B').toUpperCase()
  const mult: Record<string, number> = {
    B: 1, KB: 1e3, KIB: 1024, MB: 1e6, MIB: 1024 ** 2,
    GB: 1e9, GIB: 1024 ** 3, TB: 1e12, TIB: 1024 ** 4,
  }
  return n * (mult[unit] ?? 1)
}

type Metrics = { cpuPercent: number; ramUsed: number; ramTotal: number; diskSize: number; diskUsed: number }

// The Observability page fires ~15 infra requests at once; each `docker stats`/`df`
// is slow (~2-5s). Cache one sample per project (short TTL) + de-dupe in-flight reads
// so concurrent requests share a single docker sample and don't time out.
const metricsCache = new Map<string, { at: number; value: Metrics }>()
const inflight = new Map<string, Promise<Metrics>>()
const METRICS_TTL_MS = 10_000

async function getMetrics(ref: string): Promise<Metrics> {
  const cached = metricsCache.get(ref)
  if (cached && Date.now() - cached.at < METRICS_TTL_MS) return cached.value
  const existing = inflight.get(ref)
  if (existing) return existing
  const p = readMetrics(ref)
    .then((value) => {
      metricsCache.set(ref, { at: Date.now(), value })
      return value
    })
    .finally(() => inflight.delete(ref))
  inflight.set(ref, p)
  return p
}

async function readMetrics(ref: string): Promise<Metrics> {
  const cores = Math.max(1, os.cpus()?.length || 1)
  const hostMem = os.totalmem() || 0
  const m: Metrics = { cpuPercent: 0, ramUsed: 0, ramTotal: hostMem, diskSize: 0, diskUsed: 0 }
  try {
    const { stdout } = await execFileP(
      'docker',
      ['stats', '--no-stream', '--format', '{{.Name}};{{.CPUPerc}};{{.MemUsage}}'],
      { timeout: 8000, windowsHide: true }
    )
    let cpuSum = 0
    for (const line of stdout.split('\n')) {
      const [name, cpu, mem] = line.split(';')
      if (!name || !name.startsWith(`sb-${ref}-`)) continue
      cpuSum += parseFloat((cpu || '0').replace('%', '')) || 0
      m.ramUsed += parseBytes((mem || '').split('/')[0])
    }
    // docker CPU% is per-core (100% = one full core); normalise to host capacity.
    m.cpuPercent = Math.min(100, Number((cpuSum / cores).toFixed(2)))
    if (hostMem > 0) m.ramUsed = Math.min(m.ramUsed, hostMem)
  } catch {
    /* docker unavailable -> zeros */
  }
  try {
    const { stdout } = await execFileP(
      'docker',
      ['exec', `sb-${ref}-db-1`, 'sh', '-c', 'df -B1 /var/lib/postgresql/data | tail -1'],
      { timeout: 8000, windowsHide: true }
    )
    const cols = stdout.trim().split(/\s+/)
    m.diskSize = parseInt(cols[1] ?? '0', 10) || 0
    m.diskUsed = parseInt(cols[2] ?? '0', 10) || 0
  } catch {
    /* db container not reachable -> zeros */
  }
  return m
}

function valueFor(attr: string, m: Metrics): number {
  if (attr.includes('cpu')) return Number(m.cpuPercent.toFixed(2))
  if (attr === 'disk_fs_size') return m.diskSize
  if (attr.startsWith('disk_fs_used') || attr.includes('disk_usage')) return m.diskUsed
  if (attr.includes('disk_io') || attr.includes('iops') || attr.includes('throughput')) return 0
  if (attr.includes('swap') || attr.includes('network')) return 0
  if (attr.includes('ram') || attr.includes('memory')) {
    // `ram_usage` (summary) is a PERCENTAGE; the *_used/_free/_total breakdown is bytes.
    if (attr === 'ram_usage' || attr === 'max_memory_usage') {
      return m.ramTotal > 0 ? Number(((m.ramUsed / m.ramTotal) * 100).toFixed(2)) : 0
    }
    if (attr.includes('total') || attr.includes('limit')) return m.ramTotal
    if (attr.includes('free')) return Math.max(0, m.ramTotal - m.ramUsed)
    return m.ramUsed
  }
  return 0
}

function formatFor(attr: string): string {
  if (attr.includes('cpu')) return 'percent'
  if (attr === 'ram_usage' || attr === 'max_memory_usage') return 'percent'
  if (attr.includes('disk') || attr.includes('ram') || attr.includes('memory') || attr.includes('swap'))
    return 'bytes'
  return 'number'
}

function buildTimestamps(start: string, end: string, interval: string): string[] {
  const stepMs =
    interval === '1m' ? 60_000 : interval === '2m' ? 120_000 : interval === '5m' ? 300_000 :
    interval === '10m' ? 600_000 : interval === '30m' ? 1_800_000 : interval === '1h' ? 3_600_000 :
    interval === '1d' ? 86_400_000 : 3_600_000
  const s = Date.parse(start)
  const e = Date.parse(end || '')
  const end2 = Number.isFinite(e) ? e : Date.now()
  if (!Number.isFinite(s) || end2 <= s) return [new Date(end2).toISOString()]
  const out: string[] = []
  for (let t = s; t <= end2 && out.length < 2000; t += stepMs) out.push(new Date(t).toISOString())
  return out
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const ref = String(req.query.ref ?? '')
  const raw = req.query.attributes
  const attributes = (Array.isArray(raw) ? raw : [raw])
    .filter(Boolean)
    .flatMap((a) => String(a).split(','))
    .map((a) => a.trim())
    .filter(Boolean)
  if (attributes.length === 0) {
    return res.status(400).json({ error: { message: 'At least one attribute is required' } })
  }
  const interval = String(req.query.interval ?? '1h')
  const timestamps = buildTimestamps(String(req.query.startDate ?? ''), String(req.query.endDate ?? ''), interval)

  const m = await getMetrics(ref)
  const values: Record<string, number> = {}
  for (const a of attributes) values[a] = valueFor(a, m)

  const seriesMeta = (a: string) => {
    const v = values[a]
    return {
      yAxisLimit: Math.max(v * 1.25, formatFor(a) === 'percent' ? 100 : v || 1),
      format: formatFor(a),
      total: v,
      totalAverage: v,
    }
  }

  if (attributes.length > 1) {
    return res.status(200).json({
      data: timestamps.map((period_start) => ({
        period_start,
        values: Object.fromEntries(attributes.map((a) => [a, String(values[a])])),
      })),
      series: Object.fromEntries(attributes.map((a) => [a, seriesMeta(a)])),
    })
  }

  const a = attributes[0]
  return res.status(200).json({
    ...seriesMeta(a),
    data: timestamps.map((period_start) => ({ period_start, [a]: String(values[a]) })),
  })
}
