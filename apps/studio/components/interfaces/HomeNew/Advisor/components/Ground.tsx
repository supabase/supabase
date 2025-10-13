// Reference: advisor-game-example/src/components/Ground.js
import { usePlane } from '@react-three/cannon'
import { useAdvisorGameStore } from '../hooks/useAdvisorGameStore'
import { Grid } from '@react-three/drei'
import { useState } from 'react'

export const Ground = () => {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, -0.5, 0],
  }))
  const [hoverPos, setHoverPos] = useState<[number, number] | null>(null)
  const placeCube = useAdvisorGameStore((state) => state.placeCube)
  const getRemainingResources = useAdvisorGameStore((state) => state.getRemainingResources)
  const shouldBlockPlacement = useAdvisorGameStore((state) => state.shouldBlockPlacement)

  return (
    <>
      <mesh
        onPointerMove={(e) => {
          e.stopPropagation()
          // Calculate grid cell position for hover preview
          const [x, y, z] = Object.values(e.point).map((val) => Math.floor(val) + 0.5)
          setHoverPos([x, z])
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          setHoverPos(null)
        }}
        onClick={(e) => {
          if (shouldBlockPlacement()) {
            return
          }
          e.stopPropagation()
          if (getRemainingResources() <= 0) {
            return // No resources left
          }
          if (!placeCube) {
            return
          }
          // Snap to grid cell centers (offset by 0.5 from grid lines)
          const [x, y, z] = Object.values(e.point).map((val) => Math.floor(val) + 0.5)
          void placeCube([x, 0, z])
        }}
        ref={ref as any}
        receiveShadow
      >
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Hover highlight for placement preview */}
      {hoverPos && getRemainingResources() > 0 && (
        <mesh position={[hoverPos[0], -0.48, hoverPos[1]]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.9, 0.9]} />
          <meshBasicMaterial color="rgb(62, 207, 142)" transparent opacity={0.3} />
        </mesh>
      )}
      <Grid
        position={[0, -0.49, 0]}
        args={[100, 100]}
        cellSize={1}
        cellThickness={1}
        cellColor="rgb(62, 207, 142)"
        sectionSize={5}
        sectionThickness={1.5}
        sectionColor="rgb(62, 207, 142)"
        fadeDistance={50}
        fadeStrength={1}
        infiniteGrid={false}
      />
    </>
  )
}
