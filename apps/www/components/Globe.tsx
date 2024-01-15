import createGlobe from 'cobe'
import { useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'

const Globe = () => {
  const { resolvedTheme } = useTheme()
  const canvasRef = useRef<any>()

  useEffect(() => {
    let rotation: number = 0
    let width: number = 0
    const onResize = () => canvasRef.current && (width = canvasRef.current.offsetWidth)
    window.addEventListener('resize', onResize)
    onResize()
    const cobe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0.3,
      dark: resolvedTheme?.includes('dark') ? 1 : 0,
      diffuse: 3,
      scale: 1,
      opacity: 0.8,
      mapSamples: 20000,
      mapBrightness: 4,
      baseColor: [255 / 255, 255 / 255, 255 / 255],
      markerColor: [62 / 255, 207 / 255, 142 / 255],
      glowColor: [255 / 255, 255 / 255, 255 / 255],
      markers: [
        { location: [53.4084, 2.9916], size: 0.06 },
        { location: [1.3521, 103.8198], size: 0.06 },
        { location: [-40.9006, 174.886], size: 0.06 },
        { location: [14.0583, 108.2772], size: 0.06 },
        { location: [37.7749, -122.4194], size: 0.06 },
        { location: [41.3874, 2.1686], size: 0.06 },
        { location: [49.2827, -123.1207], size: 0.06 },
        { location: [-36.9848, 143.3906], size: 0.06 },
        { location: [42.3601, -71.0589], size: 0.06 },
        { location: [52.52, 13.405], size: 0.06 },
        { location: [33.749, -84.388], size: 0.06 },
        { location: [35.6762, 139.6503], size: 0.06 },
        { location: [9.19, -75.0152], size: 0.06 },
        { location: [-25.2521, -52.0215], size: 0.06 },
      ],
      onRender: (state) => {
        state.phi = rotation
        rotation += 0.0025
        state.width = width * 2
        state.height = width * 2
      },
    })
    setTimeout(() => (canvasRef.current.style.opacity = '1'))
    return () => {
      cobe.destroy()
      window.removeEventListener('resize', onResize)
    }
  }, [resolvedTheme])

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        contain: 'layout paint size',
        opacity: 0,
        transition: 'opacity 1s ease',
        borderRadius: '100%',
      }}
    />
  )
}

export default Globe
