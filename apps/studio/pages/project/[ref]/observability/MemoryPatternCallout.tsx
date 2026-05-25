import { Admonition } from 'ui-patterns'

const MemoryPatternCallout = () => {
  return (
    <Admonition type="default" title="What to look for in memory charts">
      <ul className="mt-1 space-y-2 text-sm text-foreground-light list-none">
        <li>
          <span className="font-medium text-foreground">Overcommitment with memory spikes</span>
          {' - '}
          If Used memory approaches or briefly exceeds Total RAM, the database is at risk of going
          offline. Even short spikes above the commit limit can trigger an out-of-memory event.
          Upgrade compute or reduce workload before the next spike.
        </li>
        <li>
          <span className="font-medium text-foreground">Gradual linear growth over time</span>
          {' - '}A steady upward trend in Used memory that does not level off is a strong signal of
          a memory leak or a workload that has outgrown the current compute size. Monitor over a
          longer window (hours to days) to confirm the trend.
        </li>
        <li>
          <span className="font-medium text-foreground">
            Shrinking Cache + Buffers at low Postgres hit rates
          </span>
          {' - '}
          Cache + Buffers penalties become significant when the Postgres hit rate falls below 95%.
          When Used memory is high, the OS shrinks Cache + Buffers to compensate, forcing more
          queries to read from disk and slowing down the database. Check the cache hit rate in the
          Query Performance report if you see this pattern.
        </li>
        <li>
          <span className="font-medium text-foreground">Other fluctuations</span>
          {' - '}
          Occasional bumps or periodic cycles in memory are generally normal and can be safely
          ignored unless they coincide with visible database degradation (slow queries, connection
          errors, or downtime).
        </li>
      </ul>
    </Admonition>
  )
}

export default MemoryPatternCallout
export { MemoryPatternCallout }
