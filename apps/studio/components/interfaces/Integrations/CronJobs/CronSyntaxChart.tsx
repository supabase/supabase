export default function CronSyntaxChart() {
  return (
    <div>
      <pre className="text-xs font-mono text-foreground-light">
        {/* prettier-ignore */}
        {`
 ┌───────────── minute (0 - 59)
 │  ┌───────────── hour (0 - 23)
 │  │  ┌───────────── day of month (1 - 31)
 │  │  │  ┌───────────── month (1 - 12)
 │  │  │  │  ┌───────────── day of week (0 - 7)
 │  │  │  │  │
 *  *  *  *  * `}
      </pre>
    </div>
  )
}
