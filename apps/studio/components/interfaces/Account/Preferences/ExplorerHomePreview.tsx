import type { ExplorerHome } from './useExplorerPreferences'

export const ExplorerHomePreview = ({ home }: { home: ExplorerHome }) => (
  <svg
    viewBox="0 0 240 128"
    fill="none"
    aria-hidden="true"
    className="mb-2 w-full rounded border border-default bg-surface-100 stroke-border"
  >
    <path d="M0 0h48v128H0z" className="fill-muted stroke-none" />
    <path d="M48 0v128" />
    <g className="fill-foreground-muted/40 stroke-none">
      <rect x="8" y="15" width="30" height="4" rx="1" />
      <rect x="8" y="32" width="26" height="3" rx="1" />
      <rect x="8" y="44" width="20" height="3" rx="1" />
      <rect x="8" y="56" width="24" height="3" rx="1" />
    </g>

    {home === 'home' ? (
      <>
        <rect x="88" y="48" width="112" height="22" rx="3" />
        <rect x="88" y="78" width="52" height="17" rx="2" />
        <rect x="148" y="78" width="52" height="17" rx="2" />
        <g className="fill-foreground-muted/40 stroke-none">
          <rect x="112" y="35" width="64" height="4" rx="1" />
          <rect x="96" y="57" width="58" height="3" rx="1" />
          <rect x="96" y="85" width="32" height="3" rx="1" />
          <rect x="156" y="85" width="32" height="3" rx="1" />
        </g>
      </>
    ) : (
      <>
        <path d="M48 65h192" />
        <g className="fill-foreground-muted/40 stroke-none">
          <rect x="62" y="18" width="30" height="3" rx="1" />
          <rect x="98" y="18" width="18" height="3" rx="1" />
          <rect x="70" y="28" width="52" height="3" rx="1" />
          <rect x="62" y="38" width="22" height="3" rx="1" />
          <rect x="90" y="38" width="40" height="3" rx="1" />
        </g>
        <rect x="58" y="77" width="172" height="12" className="fill-muted stroke-none" />
        <rect x="58" y="77" width="172" height="36" rx="2" />
        <path d="M58 89h172M58 101h172M105 77v36M168 77v36" />
      </>
    )}
  </svg>
)
