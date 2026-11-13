export const Check = ({ className }: { className?: string }) => (
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

export const IconPricingIncludedCheck = (props: any) => (
  <span className="mx-auto">
    <Check className="-ml-0.5" />
    <span className="sr-only">Included in {props.plan}</span>
  </span>
)

export const IconPricingMinus = (props: any) => (
  <>
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
    >
      <circle cx="9" cy="9" r="8.5" className="fill-background-surface-300 stroke-border" />
      <rect x="5.5" y="8.5" width="7" height="1" className="fill-foreground-lighter" />
    </svg>
    <span className="sr-only">Not included in {props.plan}</span>
  </>
)
