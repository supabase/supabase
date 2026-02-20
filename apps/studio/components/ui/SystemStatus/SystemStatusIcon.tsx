import type { SystemStatus } from './SystemStatus.utils'

export const SystemStatusIcon = ({ status }: { status: SystemStatus }) => {
  const getFillColor = (status: SystemStatus) => {
    switch (status) {
      case 'operational':
      case 'maintenance':
        return 'hsl(var(--brand-default))'
      case 'incident':
        return 'hsl(var(--warning-default))'
      default:
        return 'currentColor'
    }
  }

  const fillColor = getFillColor(status)

  return (
    <svg
      width="16"
      height="16"
      aria-label="Status Icon"
      role="img"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M13.3334 10.7999C13.8563 10.438 14.2508 9.91931 14.4597 9.31865C14.6687 8.71798 14.6813 8.06645 14.4959 7.45812C14.3104 6.84979 13.9364 6.31613 13.4279 5.93421C12.9194 5.55228 12.3026 5.34184 11.6667 5.33327H10.4667C10.2652 4.65345 9.91139 4.02849 9.43221 3.50586C8.95303 2.98322 8.36105 2.57665 7.70124 2.31702C7.04143 2.05739 6.33113 1.95153 5.62428 2.00747C4.91744 2.06341 4.23263 2.27969 3.62188 2.63988C3.01112 3.00007 2.49047 3.4947 2.09947 4.0862C1.70847 4.67771 1.4574 5.35054 1.36532 6.05359C1.27324 6.75664 1.34259 7.47143 1.56808 8.14368C1.79357 8.81592 2.16929 9.42794 2.66669 9.93327"
        stroke="hsl(var(--foreground-light))"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="12" r="3" fill={fillColor} />
    </svg>
  )
}
