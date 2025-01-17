import createGlobe from 'cobe'
import { debounce } from 'lodash'
import { useTheme } from 'next-themes'
import { useEffect, useRef } from 'react'

interface GlobeProps {
  readonly markers?: [number, number][]
  readonly currentLocation?: [number, number]
}

const Globe = ({ markers, currentLocation }: GlobeProps) => {
  const { resolvedTheme } = useTheme()
  const canvasRef = useRef<any>()
  const locationToAngles = (lat: number, long: number) => {
    return [Math.PI - ((long * Math.PI) / 180 - Math.PI / 2), (lat * Math.PI) / 180 + 0.2]
  }
  const currentPhiRef = useRef(0)
  const currentThetaRef = useRef(0.3)
  const targetPhiRef = useRef(0)
  const targetThetaRef = useRef(0.3)

  useEffect(() => {
    if (currentLocation) {
      const [lat, long] = currentLocation
      const [targetPhi, targetTheta] = locationToAngles(lat, long)
      targetPhiRef.current = targetPhi
      targetThetaRef.current = targetTheta
    }
  }, [currentLocation])

  useEffect(() => {
    let width = 0

    const onResize = () => {
      if (canvasRef.current) {
        width = canvasRef.current.offsetWidth
      }
    }
    const debouncedResize = debounce(onResize, 10)
    window.addEventListener('resize', debouncedResize)
    onResize()

    const cobe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0.3,
      dark: resolvedTheme?.includes('dark') ? 1 : 0,
      diffuse: 2,
      scale: 1,
      opacity: 1,
      mapSamples: 20000,
      mapBrightness: 4,
      baseColor: [255 / 255, 255 / 255, 255 / 255],
      markerColor: [62 / 255, 207 / 255, 142 / 255],
      glowColor: [150 / 255, 150 / 255, 150 / 255],
      markers:
        markers?.map((coords) => ({
          location: coords,
          size:
            currentLocation && coords[0] === currentLocation[0] && coords[1] === currentLocation[1]
              ? 0.1
              : 0.03,
        })) || [],
      onRender: (state) => {
        if (currentLocation) {
          const distPhiPositive =
            (targetPhiRef.current - currentPhiRef.current + Math.PI * 2) % (Math.PI * 2)
          const distPhiNegative =
            (currentPhiRef.current - targetPhiRef.current + Math.PI * 2) % (Math.PI * 2)

          if (distPhiPositive < distPhiNegative) {
            currentPhiRef.current += distPhiPositive * 0.03
          } else {
            currentPhiRef.current -= distPhiNegative * 0.03
          }

          currentThetaRef.current += (targetThetaRef.current - currentThetaRef.current) * 0.03

          state.phi = currentPhiRef.current
          state.theta = currentThetaRef.current
        } else {
          currentPhiRef.current += 0.002
          state.phi = currentPhiRef.current
          state.theta = currentThetaRef.current
        }

        state.width = width * 2
        state.height = width * 2
      },
    })

    return () => {
      window.removeEventListener('resize', debouncedResize)
      cobe.destroy()
    }
  }, [resolvedTheme, markers, currentLocation])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
}

export default Globe
