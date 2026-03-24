export const QueryInsightsHealthScore = ({
  score,
  color,
  label,
}: {
  score: number
  color: string
  label: string
}) => (
  <>
    <div
      className="h-12 w-12 rounded-full flex items-center justify-center"
      style={{
        background: `conic-gradient(${color} ${score * 3.6}deg, hsl(var(--border-default)) ${score * 3.6}deg)`,
      }}
    >
      <div
        className="h-10 w-10 rounded-full bg-studio flex items-center justify-center text-base font-medium"
        style={{ color }}
      >
        {score}
      </div>
    </div>
    <div className="flex flex-col">
      <span className="text-xs text-foreground-lighter uppercase font-mono tracking-wider">
        Health Score
      </span>
      <span className="text-xl text-foreground-light" style={{ color }}>
        {label}
      </span>
    </div>
  </>
)
