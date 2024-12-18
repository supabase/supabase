import createGlobe from 'cobe'
import { useCallback, useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'
import { debounce } from 'lodash'

interface GlobeProps {
  readonly markers?: [number, number]
  readonly currentLocation?: [number, number]
}

const Globe = ({ markers, currentLocation }: GlobeProps) => {
  const { resolvedTheme } = useTheme()
  const canvasRef = useRef<any>()
  const locationToAngles = (lat: number, long: number) => {
    return [Math.PI - ((long * Math.PI) / 180 - Math.PI / 2), (lat * Math.PI) / 180]
  }
  const focusRef = useRef([0, 0])
  const currentLocationRef = useRef(currentLocation)

  useEffect(() => {
    currentLocationRef.current = currentLocation
    if (currentLocation) {
      const [lat, long] = currentLocation
      focusRef.current = locationToAngles(lat, long)
    }
  }, [currentLocation])

  useEffect(() => {
    let width = 0
    let currentPhi = 0
    let currentTheta = 0
    const doublePi = Math.PI * 2

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
      phi: 0,
      theta: 0.3,
      dark: resolvedTheme?.includes('dark') ? 1 : 0,
      diffuse: 3,
      scale: 1,
      opacity: 1,
      mapSamples: 20000,
      mapBrightness: 4,
      baseColor: [255 / 255, 255 / 255, 255 / 255],
      markerColor: [62 / 255, 207 / 255, 142 / 255],
      glowColor: [100 / 255, 100 / 255, 100 / 255],
      markers: markers
        ? markers.map((coords) => ({
            location: coords,
            size: 0.05,
          }))
        : undefined,
      onRender: (state) => {
        if (currentLocationRef.current) {
          state.phi = currentPhi
          state.theta = currentTheta
          const [focusPhi, focusTheta] = focusRef.current
          const distPositive = (focusPhi - currentPhi + doublePi) % doublePi
          const distNegative = (currentPhi - focusPhi + doublePi) % doublePi

          if (distPositive < distNegative) {
            currentPhi += distPositive * 0.03
          } else {
            currentPhi -= distNegative * 0.03
          }
          currentTheta = currentTheta * 0.97 + focusTheta * 0.03
        } else {
          // Slow constant rotation when no location is focused
          state.phi = currentPhi
          currentPhi += 0.002
        }

        state.width = width * 2
        state.height = width * 2
      },
    })

    return () => {
      window.removeEventListener('resize', debouncedResize)
      cobe.destroy()
    }
  }, [resolvedTheme])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
}

export default Globe
