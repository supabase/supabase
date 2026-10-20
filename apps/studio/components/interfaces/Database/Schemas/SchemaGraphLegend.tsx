import { DiamondIcon, FingerprintIcon, HashIcon, KeyIcon } from 'lucide-react'

export const SchemaGraphLegend = () => {
  return (
    <div className="absolute bottom-0 left-0 border-t flex justify-center px-1 py-2 shadow-md bg-surface-100 w-full z-10">
      <ul className="flex flex-wrap  items-center justify-center gap-4">
        <li className="flex items-center text-xs font-mono gap-1">
          <KeyIcon size={15} strokeWidth={1.5} className="shrink-0 text-light" />
          Primary key
        </li>
        <li className="flex items-center text-xs font-mono gap-1">
          <HashIcon size={15} strokeWidth={1.5} className="shrink-0 text-light" />
          Identity
        </li>
        <li className="flex items-center text-xs font-mono gap-1">
          <FingerprintIcon size={15} strokeWidth={1.5} className="shrink-0 text-light" />
          Unique
        </li>
        <li className="flex items-center text-xs font-mono gap-1">
          <DiamondIcon size={15} strokeWidth={1.5} className="shrink-0 text-light" />
          Nullable
        </li>
        <li className="flex items-center text-xs font-mono gap-1">
          <DiamondIcon
            size={15}
            strokeWidth={1.5}
            fill="currentColor"
            className="shrink-0 text-light"
          />
          Non-Nullable
        </li>
      </ul>
    </div>
  )
}
