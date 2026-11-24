import { Fragment, useId, type ReactNode } from 'react'
import { cn } from 'ui'

export interface GlassLensProps {
  children: ReactNode
  className?: string
  curvature?: number
  chroma?: number
  shimmer?: number
  edgeWidth?: number
  seed?: number
}

interface ChannelBend {
  bend: number
  shimmer: number
}

// offset from the edge and the map value there. 128 is the neutral value, so the center does not move
const LENS_RAMP = [
  [0, 255],
  [0.25, 212],
  [0.56, 166],
  [1, 128],
] as const

const toDataUrl = (svg: string): string => `data:image/svg+xml,${encodeURIComponent(svg)}`

const getLensMap = ({ axis, edgeWidth }: { axis: 'x' | 'y'; edgeWidth: number }): string => {
  const toColor = (value: number) => {
    const hex = value.toString(16).padStart(2, '0')
    return axis === 'x' ? `#${hex}0000` : `#00${hex}00`
  }
  const startStops = LENS_RAMP.map(
    ([offset, value]) => `<stop offset="${offset * edgeWidth}" stop-color="${toColor(value)}"/>`
  )
  const endStops = [...LENS_RAMP]
    .reverse()
    .map(
      ([offset, value]) =>
        `<stop offset="${1 - offset * edgeWidth}" stop-color="${toColor(256 - value)}"/>`
    )
  const direction = axis === 'x' ? '' : ' x2="0" y2="1"'
  return toDataUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1" preserveAspectRatio="none"><linearGradient id="g"${direction}>${[...startStops, ...endStops].join('')}</linearGradient><rect width="1" height="1" fill="url(#g)"/></svg>`
  )
}

// a channel map mixes the lens bend and the noise. the weights keep every value in range, so no offset clips
const getChannelMix = ({ bend, shimmer }: ChannelBend) => {
  const scale = Math.abs(bend) + shimmer
  if (scale === 0) return { scale: 0, k2: 0, k3: 0, k4: 0.5 }
  const k2 = bend / scale
  const k3 = shimmer / scale
  return { scale, k2, k3, k4: 0.5 - (k2 + k3) / 2 }
}

export const GlassLens = ({
  children,
  className,
  curvature = 0,
  chroma = 0,
  shimmer = 0,
  edgeWidth = 0.16,
  seed = 3,
}: GlassLensProps) => {
  const filterId = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const edgeMask = toDataUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1" preserveAspectRatio="none"><linearGradient id="h"><stop offset="0" stop-color="#fff"/><stop offset="${edgeWidth}" stop-color="#fff" stop-opacity="0"/><stop offset="${1 - edgeWidth}" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff"/></linearGradient><linearGradient id="v" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="${edgeWidth}" stop-color="#fff" stop-opacity="0"/><stop offset="${1 - edgeWidth}" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff"/></linearGradient><rect width="1" height="1" fill="url(#h)"/><rect width="1" height="1" fill="url(#v)"/></svg>`
  )

  return (
    <>
      <svg aria-hidden className="absolute size-0">
        <filter id={filterId} x="0" y="0" width="1" height="1" colorInterpolationFilters="sRGB">
          <feImage
            href={getLensMap({ axis: 'x', edgeWidth })}
            preserveAspectRatio="none"
            result="mapX"
          />
          <feImage
            href={getLensMap({ axis: 'y', edgeWidth })}
            preserveAspectRatio="none"
            result="mapY"
          />
          <feComposite in="mapX" in2="mapY" operator="arithmetic" k2="1" k3="1" result="lens" />
          <feImage href={edgeMask} preserveAspectRatio="none" result="edge" />
          {/* mid gray is zero displacement, so the noise outside the edge mask moves nothing */}
          <feFlood floodColor="#808080" result="neutral" />
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed={seed} />
          <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0 1" />
          <feComposite in2="edge" operator="in" />
          <feComposite in2="neutral" operator="over" result="noise" />
          <feColorMatrix
            in="noise"
            values="0 0 1 0 0  1 0 0 0 0  0 1 0 0 0  0 0 0 1 0"
            result="noiseAlt"
          />
          {/* red and blue split around green and read different noise channels, so the fringe color changes along the edge */}
          {[
            {
              name: 'red',
              noise: 'noise',
              matrix: '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0',
              ...getChannelMix({ bend: curvature + chroma / 2, shimmer }),
            },
            {
              name: 'green',
              noise: 'noise',
              matrix: '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0',
              ...getChannelMix({ bend: curvature, shimmer: 0 }),
            },
            {
              name: 'blue',
              noise: 'noiseAlt',
              matrix: '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0',
              ...getChannelMix({ bend: curvature - chroma / 2, shimmer }),
            },
          ].map(({ name, noise, matrix, scale, k2, k3, k4 }) => (
            <Fragment key={name}>
              <feComposite
                in="lens"
                in2={noise}
                operator="arithmetic"
                k2={k2}
                k3={k3}
                k4={k4}
                result={`${name}Map`}
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2={`${name}Map`}
                scale={scale}
                xChannelSelector="R"
                yChannelSelector="G"
              />
              <feColorMatrix values={matrix} result={name} />
            </Fragment>
          ))}
          <feBlend in="red" in2="green" mode="screen" result="redGreen" />
          <feBlend in="redGreen" in2="blue" mode="screen" />
        </filter>
      </svg>
      <span className={cn('block', className)} style={{ filter: `url(#${filterId})` }}>
        {children}
      </span>
    </>
  )
}
