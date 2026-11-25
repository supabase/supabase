export const PlanCheckIcon = ({ className }: { className?: string }) => (
  <svg
    aria-hidden="true"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="25"
    viewBox="0 0 24 25"
    fill="none"
  >
    <circle cx="12" cy="12.212" r="9" className="fill-primary/10 stroke-primary/15" />
    <path
      className="fill-primary"
      d="M11.292 14.798l4.463-4.463-.707-.708-4.11 4.11-1.986-1.986-.707.707 2.34 2.34h.707Z"
    />
  </svg>
)

export const PlanMinusIcon = ({ className }: { className?: string }) => (
  <svg
    aria-hidden="true"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="25"
    viewBox="0 0 24 25"
    fill="none"
  >
    <circle cx="12" cy="12.212" r="9" className="fill-background-surface-300 stroke-border" />
    <rect x="8.5" y="11.712" width="7" height="1" className="fill-foreground-lighter" />
  </svg>
)
