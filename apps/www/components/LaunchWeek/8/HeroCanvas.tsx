import React, { useCallback, useEffect, useRef, useState } from 'react'
// import { Canvas, View, Layer, Rectangle } from 'react-paper-bindings'
const paper = require('paper')

export default function HeroCanvas() {
  console.log('paper', paper)
  const canvasRef = useRef<any>(null)

  if (!paper || typeof window === 'undefined') return null
  // const canvas = canvasRef.current
  // paper.setup(canvas)

  const draw = (ctx: any, frameCount: any) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(50, 100, 20 * Math.sin(frameCount * 0.05) ** 2, 0, 2 * Math.PI)
    ctx.fill()
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    let frameCount = 0
    let animationFrameId: any

    //Our draw came here
    const render = () => {
      frameCount++
      draw(context, frameCount)
      animationFrameId = window.requestAnimationFrame(render)
    }
    render()

    return () => {
      window.cancelAnimationFrame(animationFrameId)
    }
  }, [draw])

  return (
    <div className="flex-1 w-full container">
      HeroCanv
      {/* <Canvas width={400} height={300}>
        <View>
          <Layer>
            <Rectangle
              center={[100, 100]}
              fillColor={'red'}
              size={[50, 50]}
              // onClick={toggleColor}
            />
          </Layer>
        </View>
      </Canvas> */}
      <canvas className="w-full h-full" ref={canvasRef} id="paper" />
    </div>
  )
}
