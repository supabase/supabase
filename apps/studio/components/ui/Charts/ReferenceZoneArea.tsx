import type { Props as RectangleProps } from 'recharts/types/shape/Rectangle'

export const ReferenceZoneArea = ({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  fill,
  fillOpacity,
  clipPath,
}: RectangleProps) => (
  <g clipPath={clipPath}>
    <rect
      className="recharts-reference-area-rect"
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      fillOpacity={fillOpacity}
    />
    <line
      x1={x}
      x2={x + width}
      y1={y + height}
      y2={y + height}
      stroke={fill}
      strokeOpacity={0.6}
      strokeWidth={1}
    />
  </g>
)
