// Simplified camera with orbital controls instead of FPV
// Reference: advisor-game-example uses PointerLockControls, we use OrbitControls for easier interaction
import { OrbitControls } from '@react-three/drei'
import { useAdvisorGameStore } from '../hooks/useAdvisorGameStore'

export const Camera = () => {
  const markCameraInteraction = useAdvisorGameStore((state) => state.markCameraInteraction)

  return (
    <OrbitControls
      makeDefault
      minDistance={5}
      maxDistance={25}
      minPolarAngle={0}
      maxPolarAngle={Math.PI / 2.1}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      panSpeed={0.5}
      onChange={markCameraInteraction}
      // OrbitControls natively supports Shift+Left Click to pan
    />
  )
}
