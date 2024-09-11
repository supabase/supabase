import React, { useRef, useEffect, useState } from 'react'

interface Dot {
  x: number // X position of the dot
  y: number // Y position of the dot
  startTime: number // Timestamp when the dot was created
}

const DOT_RADIUS = 1 // Radius of each dot in pixels

const useDraw = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const isDrawing = useRef(false)
  const [dots, setDots] = useState<Dot[]>([]) // Store dots with their opacity and timestamp
  const lastPosition = useRef<{ x: number; y: number } | null>(null) // Store the last position

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return // Check if canvas is available
    const context = canvas.getContext('2d')
    if (!context) return // Check if context is available
    ctxRef.current = context

    const handleMouseEnter = () => {
      isDrawing.current = true // Start drawing when mouse enters
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDrawing.current) return // Only draw if mouse is inside canvas
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      if (lastPosition.current) {
        const distance = Math.sqrt(
          (x - lastPosition.current.x) ** 2 + (y - lastPosition.current.y) ** 2
        )

        // Calculate how many dots to add based on the distance
        const numDots = Math.floor(distance / (DOT_RADIUS * 2)) // Adjust based on dot radius
        const now = performance.now()

        // Draw dots along the line with consistent density
        for (let i = 0; i <= numDots; i++) {
          const dotX = lastPosition.current.x + ((x - lastPosition.current.x) / numDots) * i
          const dotY = lastPosition.current.y + ((y - lastPosition.current.y) / numDots) * i

          // Add new dot with full opacity and current timestamp
          setDots((prevDots) => [...prevDots, { x: dotX, y: dotY, startTime: now }])
        }
      }

      // Update last position
      lastPosition.current = { x, y }
    }

    const handleMouseLeave = () => {
      isDrawing.current = false // Stop drawing when mouse leaves
      lastPosition.current = null // Reset last position
    }

    const draw = () => {
      context.clearRect(0, 0, canvas.width, canvas.height)
      const now = performance.now()

      // Draw the dots with fading effect
      dots.forEach((dot) => {
        const elapsedTime = now - dot.startTime
        const opacity = Math.max(1 - elapsedTime / 1000, 0) // Fade over 1 second

        if (opacity > 0) {
          // Only draw dots that are still visible
          context.globalAlpha = opacity // Set dot opacity
          context.beginPath()
          context.arc(dot.x, dot.y, DOT_RADIUS, 0, Math.PI * 2) // Draw dot as a circle
          context.fillStyle = 'white' // Set fill color to white
          context.fill() // Fill the dot
        }
      })

      context.globalAlpha = 1 // Reset global alpha for any future drawing
      requestAnimationFrame(draw) // Continue the drawing loop
    }

    canvas.addEventListener('mouseenter', handleMouseEnter)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseleave', handleMouseLeave)

    requestAnimationFrame(draw) // Start the drawing loop

    return () => {
      canvas.removeEventListener('mouseenter', handleMouseEnter)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [canvasRef, dots])

  return ctxRef
}

const RealtimeVisual = () => {
  const containerRef = useRef<HTMLElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useDraw(canvasRef)

  return (
    <figure
      ref={containerRef}
      className="absolute inset-0 xl:-bottom-2 2xl:bottom-0 z-0 w-full overflow-hidden !pointer-events-auto"
      role="img"
      aria-label="Supabase Realtime multiplayer app demo"
    >
      <canvas
        ref={canvasRef}
        width={containerRef?.current?.offsetWidth}
        height={containerRef?.current?.offsetHeight}
        className="w-full h-full"
      />
      <div
        className="
            absolute pointer-events-none
            w-full h-full max-h-[400px] lg:max-h-none
            inset-0 top-auto
            lg:bg-[linear-gradient(to_top,transparent_0%,transparent_60%,hsl(var(--background-surface-75))_80%)]
          "
      />
    </figure>
  )
}

export default RealtimeVisual
