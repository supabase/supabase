import career from '../data/career.json'
import createGlobe from 'cobe'
import { useEffect, useRef } from 'react'

const Globe = () => {
  const canvasRef = useRef()

  useEffect(() => {
    let rotation: number = 0
    const width: number = 0
    const onResize = () => canvasRef.current && (width = canvasRef.current.offsetWidth)
    window.addEventListener('resize', onResize)
    onResize()
    const cobe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0.3,
      dark: 1,
      diffuse: 3,
      scale: 1,
      mapSamples: 20000,
      mapBrightness: 4,
      baseColor: [1, 1, 1],
      markerColor: [62 / 255, 207 / 255, 142 / 255],
      glowColor: [62 / 255, 207 / 255, 142 / 255],
      markers: career.globe.markers,
      onRender: (state) => {
        state.phi = rotation
        rotation += 0.005
        state.width = width * 2
        state.height = width * 2
      },
    })
    setTimeout(() => (canvasRef.current.style.opacity = '1'))
    return () => cobe.destroy()
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        contain: 'layout paint size',
        opacity: 0,
        transition: 'opacity 1s ease',
        borderRadius: '100%'
      }}
    />
  )
}

export default Globe
