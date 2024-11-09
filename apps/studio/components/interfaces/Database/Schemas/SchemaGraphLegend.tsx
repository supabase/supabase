import { DiamondIcon, Fingerprint, Hash, Key } from 'lucide-react'

export const SchemaGraphLegend = () => {
  const SIZE = 12

  return (
    <div className="absolute top-0 left-0 flex justify-center px-1 py-2 shadow-md bg-surface-100 w-full z-10 border-b">
      <ul className="flex flex-wrap items-center justify-center gap-4">
        <li className="flex items-center text-[10px] font-mono gap-1 text-foreground-light">
          <Key
            size={SIZE}
            strokeWidth={1.5}
            className="flex-shrink-0 text-foreground-lighter opacity-75"
          />
          Primary key
        </li>
        <li className="flex items-center text-[10px] font-mono gap-1 text-foreground-light">
          <Hash
            size={SIZE}
            strokeWidth={1.5}
            className="flex-shrink-0 text-foreground-lighter opacity-75"
          />
          Identity
        </li>
        <li className="flex items-center text-[10px] font-mono gap-1 text-foreground-light">
          <Fingerprint
            size={SIZE}
            strokeWidth={1.5}
            className="flex-shrink-0 text-foreground-lighter opacity-75"
          />
          Unique
        </li>
        <li className="flex items-center text-[10px] font-mono gap-1 text-foreground-light">
          <DiamondIcon
            size={SIZE}
            strokeWidth={1.5}
            className="flex-shrink-0 text-foreground-lighter opacity-75"
          />
          Nullable
        </li>
        <li className="flex items-center text-[10px] font-mono gap-1 text-foreground-light">
          <DiamondIcon
            size={SIZE}
            strokeWidth={1.5}
            fill="currentColor"
            className="flex-shrink-0 text-foreground-lighter opacity-75"
          />
          Non-Nullable
        </li>
      </ul>
    </div>
  )
}
