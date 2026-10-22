import type { Props as RectangleProps } from 'recharts/types/shape/Rectangle'

export const ThresholdZoneLine = ({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  stroke,
  strokeOpacity,
  clipPath,
  label,
  isRising = false,
}: RectangleProps & { label?: string; isRising?: boolean }) => (
  <path
    clipPath={clipPath}
    d={`M ${x} ${isRising ? y + height : y} V ${isRising ? y : y + height} H ${x + width}`}
    fill="none"
    stroke={stroke}
    strokeOpacity={strokeOpacity}
    strokeWidth={1}
    pointerEvents="none"
    strokeDasharray="4 4"
  >
    {label && <title>{label}</title>}
  </path>
)
