// Reference: advisor-game-example/src/components/Cube.js
import { useBox } from '@react-three/cannon'
import { useState } from 'react'
import { useAdvisorGameStore } from '../hooks/useAdvisorGameStore'
import * as THREE from 'three'
import type { Mesh } from 'three'

interface CubeProps {
  cubeKey: string
  position: [number, number, number]
  texture: string
  createdBy?: string | null
  projectRef?: string
  isCurrentProject?: boolean
}

export const Cube = ({ position, createdBy, projectRef, isCurrentProject }: CubeProps) => {
  const [hoveredFace, setHoveredFace] = useState<number | null>(null)
  const [ref] = useBox(() => ({
    type: 'Static',
    position,
  }))
  const placeCube = useAdvisorGameStore((state) => state.placeCube)
  const removeCube = useAdvisorGameStore((state) => state.removeCube)
  const getRemainingResources = useAdvisorGameStore((state) => state.getRemainingResources)
  const currentUserId = useAdvisorGameStore((state) => state.currentUserId)
  const shouldBlockPlacement = useAdvisorGameStore((state) => state.shouldBlockPlacement)

  // Use gray color for blocks from other projects, green for current project
  const baseColor = isCurrentProject ? 'rgb(62, 207, 142)' : 'rgb(128, 128, 128)'
  const edgeColor = isCurrentProject ? 'rgb(62, 207, 142)' : 'rgb(128, 128, 128)'

  return (
    <group>
      <mesh
        onPointerMove={(e) => {
          e.stopPropagation()
          const faceIndex =
            e.faceIndex !== null && e.faceIndex !== undefined ? Math.floor(e.faceIndex / 2) : null
          setHoveredFace(faceIndex)
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          setHoveredFace(null)
        }}
        onClick={(e) => {
          const blockPlacement = shouldBlockPlacement()
          if (blockPlacement && !e.altKey) {
            return
          }
          e.stopPropagation()
          const clickedFace =
            e.faceIndex !== null && e.faceIndex !== undefined ? Math.floor(e.faceIndex / 2) : 0
          const { x, y, z } = (ref.current as Mesh).position

          // Alt+Click to remove
          if (e.altKey) {
            if (!removeCube) {
              return
            }
            // Only allow deletion of cubes from the current project
            if (!isCurrentProject) {
              return
            }
            if (createdBy && currentUserId && createdBy !== currentUserId) {
              return
            }
            void removeCube([x, y, z])
            return
          }

          if (blockPlacement) {
            return
          }

          // Check if we have resources before adding
          if (getRemainingResources() <= 0) {
            return
          }

          // Add cube adjacent to clicked face
          if (!placeCube) {
            return
          }
          if (clickedFace === 0) {
            void placeCube([x + 1, y, z])
          } else if (clickedFace === 1) {
            void placeCube([x - 1, y, z])
          } else if (clickedFace === 2) {
            void placeCube([x, y + 1, z])
          } else if (clickedFace === 3) {
            void placeCube([x, y - 1, z])
          } else if (clickedFace === 4) {
            void placeCube([x, y, z + 1])
          } else if (clickedFace === 5) {
            void placeCube([x, y, z - 1])
          }
        }}
        ref={ref as any}
        castShadow
        receiveShadow
      >
        <boxGeometry />
        {/* Create 6 materials, one for each face */}
        {[0, 1, 2, 3, 4, 5].map((faceIndex) => (
          <meshStandardMaterial
            key={faceIndex}
            attach={`material-${faceIndex}`}
            color={hoveredFace === faceIndex ? baseColor : baseColor}
            emissive={baseColor}
            emissiveIntensity={hoveredFace === faceIndex ? 0.4 : 0.1}
            metalness={0.8}
            roughness={0.2}
          />
        ))}
      </mesh>
      {/* Tron-style edge glow */}
      <lineSegments position={position}>
        <edgesGeometry args={[new THREE.BoxGeometry(1, 1, 1)]} />
        <lineBasicMaterial
          color={edgeColor}
          transparent
          opacity={hoveredFace !== null ? 0.8 : 0.5}
        />
      </lineSegments>
    </group>
  )
}
