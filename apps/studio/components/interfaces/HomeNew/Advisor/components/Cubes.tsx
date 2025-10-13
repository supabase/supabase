// Reference: advisor-game-example/src/components/Cubes.js
import { useMemo } from 'react'
import { useAdvisorGameStore } from '../hooks/useAdvisorGameStore'
import { Cube } from './Cube'

interface CubesProps {
  projectRef: string
}

export const Cubes = ({ projectRef }: CubesProps) => {
  const allCubes = useAdvisorGameStore((state) => state.allCubes)
  const currentProjectRef = useAdvisorGameStore((state) => state.currentProjectRef)

  const cubes = useMemo(() => allCubes, [allCubes])

  return (
    <>
      {cubes.map(({ cubeKey, pos, texture, createdBy, projectRef: cubeProjectRef }) => (
        <Cube
          key={cubeKey}
          cubeKey={cubeKey}
          position={pos}
          texture={texture}
          createdBy={createdBy}
          projectRef={cubeProjectRef}
          isCurrentProject={cubeProjectRef === currentProjectRef}
        />
      ))}
    </>
  )
}
