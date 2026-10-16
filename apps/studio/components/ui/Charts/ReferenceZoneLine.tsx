import type { Props as RectangleProps } from 'recharts/types/shape/Rectangle'

export const ReferenceZoneLine = ({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  stroke,
  strokeOpacity,
  clipPath,
  label,
}: RectangleProps & { label?: string }) => (
  <line
    clipPath={clipPath}
    x1={x}
    x2={x + width}
    y1={y + height}
    y2={y + height}
    stroke={stroke}
    strokeOpacity={strokeOpacity}
    strokeWidth={1}
    pointerEvents="none"
    strokeDasharray="4 4"
  >
    {label && <title>{label}</title>}
  </line>
)
