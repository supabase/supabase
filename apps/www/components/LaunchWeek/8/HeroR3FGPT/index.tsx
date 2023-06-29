import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
// import { CurveModifier } from 'three/examples/jsm/modifiers/CurveModifier';
// import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
// import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass';

const Animation = () => {
  const curveRef = useRef<any>()
  const particlesRef = useRef<any>()

  // const CurveModifierPass = CurveModifier(ShaderPass);
  // const GlitchPassEffect = new GlitchPass(ShaderPass);

  // const curve = new THREE.Curves.FigureEightCurve3(10);
  const curve = new THREE.CubicBezierCurve(
    new THREE.Vector2(-10, 0),
    new THREE.Vector2(-5, 15),
    new THREE.Vector2(20, 15),
    new THREE.Vector2(10, 0)
  )
  curveRef.current = curve

  const numParticles = 30
  const particles = []
  const particlePositions = []

  for (let i = 0; i < numParticles; i++) {
    const particle = new THREE.Vector3()
    particles.push(particle)
    particlePositions.push(particle)
  }

  particlesRef.current = particles

  useEffect(() => {
    const animateParticles = (clock: any) => {
      const time = clock.getElapsedTime()

      // Update particle positions
      for (let i = 0; i < numParticles; i++) {
        const particle = particlesRef.current[i]
        const offset = Math.sin(i * 0.3 + time * 0.2) * 10
        const curveOffset = curveRef.current.getPointAt(offset)

        particle.copy(curveOffset)

        // Add some randomness to particle position
        particle.x += Math.random() * 2 - 1
        particle.y += Math.random() * 2 - 1
        particle.z += Math.random() * 2 - 1
      }
    }

    const clock = new THREE.Clock()
    const renderLoop = () => {
      animateParticles(clock)
      // Schedule the next frame
      requestAnimationFrame(renderLoop)
    }
    renderLoop()
  }, [])

  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      {/* <CurveModifierPass attachArray="passes" curve={curveRef.current} />
      <GlitchPassEffect attachArray="passes" /> */}
      {particlesRef.current.map((particle: any, index: number) => (
        <mesh key={index} position={particle}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshBasicMaterial color="#ffff00" />
        </mesh>
      ))}
    </Canvas>
  )
}

export default Animation
