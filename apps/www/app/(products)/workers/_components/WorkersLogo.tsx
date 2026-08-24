interface WorkersLogoProps {
  size?: number
  className?: string
}

/**
 * The Workers mark: a solid outer hexagon around an inner isometric cube.
 * Kept as its own multi-path component because the shared product-icon
 * system (`shared-data/products.ts`) stores a single `d` string per size
 * with one uniform stroke, so it can't carry the per-path linecap styles.
 */
export function WorkersLogo({ size = 18, className }: WorkersLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M15.75 12V5.99999C15.7497 5.73694 15.6803 5.4786 15.5487 5.25086C15.417 5.02312 15.2278 4.83401 15 4.70249L9.75 1.70249C9.52197 1.57084 9.2633 1.50153 9 1.50153C8.7367 1.50153 8.47803 1.57084 8.25 1.70249L3 4.70249C2.7722 4.83401 2.58299 5.02312 2.45135 5.25086C2.31971 5.4786 2.25027 5.73694 2.25 5.99999V12C2.25027 12.263 2.31971 12.5214 2.45135 12.7491C2.58299 12.9769 2.7722 13.166 3 13.2975L8.25 16.2975C8.47803 16.4291 8.7367 16.4985 9 16.4985C9.2633 16.4985 9.52197 16.4291 9.75 16.2975L15 13.2975C15.2278 13.166 15.417 12.9769 15.5487 12.7491C15.6803 12.5214 15.7497 12.263 15.75 12Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 10.6011V7.4004C12.9998 7.26009 12.9587 7.12227 12.8807 7.00079C12.8027 6.8793 12.6906 6.77842 12.5556 6.70826L9.44444 5.10793C9.30932 5.0377 9.15603 5.00073 9 5.00073C8.84397 5.00073 8.69068 5.0377 8.55556 5.10793L5.44444 6.70826C5.30945 6.77842 5.19732 6.8793 5.11932 7.00079C5.04131 7.12227 5.00016 7.26009 5 7.4004V10.6011C5.00016 10.7414 5.04131 10.8792 5.11932 11.0007C5.19732 11.1222 5.30945 11.223 5.44444 11.2932L8.55556 12.8935C8.69068 12.9638 8.84397 13.0007 9 13.0007C9.15603 13.0007 9.30932 12.9638 9.44444 12.8935L12.5556 11.2932C12.6906 11.223 12.8027 11.1222 12.8807 11.0007C12.9587 10.8792 12.9998 10.7414 13 10.6011Z"
        stroke="currentColor"
        strokeLinecap="square"
        strokeLinejoin="round"
      />
      <path
        d="M6 7.00073L9 9.00073L12 7.00073"
        stroke="currentColor"
        strokeLinecap="square"
        strokeLinejoin="round"
      />
      <path
        d="M9 12.5V9.00073"
        stroke="currentColor"
        strokeLinecap="square"
        strokeLinejoin="round"
      />
    </svg>
  )
}
