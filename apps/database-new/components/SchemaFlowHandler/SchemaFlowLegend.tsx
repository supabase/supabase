import { DiamondIcon, Fingerprint, Hash, Key } from 'lucide-react'

const SchemaFlowLegend = () => {
  return (
    <div className="absolute bottom-0 left-0 border-t flex justify-center px-1 py-2 shadow-md bg-surface-100 w-full z-10">
      {/* <h3 className="text-xs font-bold">Legend</h3> */}
      <ul className="flex flex-wrap  items-center justify-center gap-2">
        <li className="flex items-center text-xs font-mono gap-1">
          <Key size={12} strokeWidth={1} className="flex-shrink-0 text-light" />
          Primary key
        </li>
        <li className="flex items-center text-xs font-mono gap-1">
          <Hash size={12} strokeWidth={1} className="flex-shrink-0 text-light" />
          Identity
        </li>
        <li className="flex items-center text-xs font-mono gap-1">
          <Fingerprint size={12} strokeWidth={1} className="flex-shrink-0 text-light" />
          Unique
        </li>
        <li className="flex items-center text-xs font-mono gap-1">
          <DiamondIcon size={12} strokeWidth={1} className="flex-shrink-0 text-light" />
          Nullable
        </li>
        <li className="flex items-center text-xs font-mono gap-1">
          <DiamondIcon
            size={12}
            strokeWidth={1}
            fill="currentColor"
            className="flex-shrink-0 text-light"
          />
          Non-Nullable
        </li>
      </ul>
    </div>
  )
}

export default SchemaFlowLegend
