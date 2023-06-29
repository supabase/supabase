import { useEffect, useRef } from 'react'

const HeroGPTParticles = () => {
  const canvasRef = useRef(null)
  const path = [
    { x: 50, y: 50 },
    { x: 100, y: 200 },
    { x: 200, y: 150 },
    { x: 300, y: 300 },
  ]
  let currentPointIndex = 0

  useEffect(() => {
    const canvas: any = canvasRef.current
    const ctx = canvas.getContext('2d')

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.beginPath()
      ctx.arc(path[currentPointIndex].x, path[currentPointIndex].y, 5, 0, 2 * Math.PI, false)
      ctx.fillStyle = 'red'
      ctx.fill()
      ctx.closePath()

      currentPointIndex++
      if (currentPointIndex >= path.length) {
        currentPointIndex = 0
      }

      requestAnimationFrame(draw)
    }

    draw()
  }, [])

  return <canvas ref={canvasRef} width={400} height={400} />
}

export default HeroGPTParticles
