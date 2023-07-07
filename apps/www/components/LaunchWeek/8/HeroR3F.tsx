import * as THREE from 'three'
import React, { Suspense, useState, useEffect, useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Trail } from '@react-three/drei'

const Particle = () => {
  const particle = useRef<any>(null)

  function easeInOutExpo(x: number): number {
    return x === 0
      ? 0
      : x === 1
      ? 1
      : x < 0.5
      ? Math.pow(2, 20 * x - 10) / 2
      : (2 - Math.pow(2, -20 * x + 10)) / 2
  }

  function easeOutBounce(x: number): number {
    const n1 = 7.5625
    const d1 = 2.75

    if (x < 1 / d1) {
      return n1 * x * x
    } else if (x < 2 / d1) {
      return n1 * (x -= 1.5 / d1) * x + 0.75
    } else if (x < 2.5 / d1) {
      return n1 * (x -= 2.25 / d1) * x + 0.9375
    } else {
      return n1 * (x -= 2.625 / d1) * x + 0.984375
    }
  }

  const easingFunc = (x: number): number => {
    // if (x > 0.75) {
    //   return x + 2
    //   if (x > 0.75) {
    //   }
    // }
    return x
  }

  useFrame(({ clock }) => {
    const timer = clock.getElapsedTime() * 2
    // if (a < 10) {
    particle.current.position.x = Math.sin(-timer) * 100
    // particle.current.position.y = Math.cos(a * 1) * 100
    particle.current.position.y +=
      // Math.floor(timer) % 4 === 0
      particle.current.position.x > 0
        ? // ? Math.sin(easingFunc(Math.cos(timer))) * 100 - 100
          Math.cos(timer) * 10 - 10
        : -Math.cos(timer) * 10 + 10
    // console.log(
    //   Math.floor(timer) % 4 === 0,
    //   timer.toFixed(2),
    //   (timer % 2).toFixed(2),
    //   Math.sin(timer).toFixed(2),
    //   Math.cos(timer).toFixed(2),
    //   `x: ${particle.current.position.x.toFixed(2)}`,
    //   `y: ${particle.current.position.y.toFixed(2)}`
    // )
    // }
  })

  return (
    <Trail
      width={10} // Width of the line
      color={'white'} // Color of the line
      length={60} // Length of the line
      decay={2} // How fast the line fades away
      local={true} // Wether to use the target's world or local positions
      stride={0} // Min distance between previous and current point
      interval={1} // Number of frames to wait before next calculation
      target={particle} // Optional target. This object will produce the trail.
      attenuation={(width) => (width / 2) * width} // A function to define the width in each point along it.
    >
      <mesh ref={particle}>
        <circleGeometry args={[2, 16]} />
        <meshStandardMaterial color="#f1f1f1" />
      </mesh>
    </Trail>
  )
}

export default function () {
  if (typeof window === 'undefined') return null
  const size = {
    width: window.innerWidth,
    height: window.innerHeight,
  }

  return (
    <Canvas
      linear
      dpr={[1, 2]}
      camera={{ fov: 75, position: [0, 0, 400] }}
      // onCreated={}
    >
      <ambientLight intensity={0.5} />
      <Particle />
    </Canvas>
  )
}
