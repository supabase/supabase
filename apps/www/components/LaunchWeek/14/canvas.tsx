import * as THREE from 'three'
import { cn } from 'ui'
import { createThreeSetup, useThreeJS, createTicketMesh } from './helpers'

const LwCanvas = ({ className }: { className?: string }) => {
  const { containerRef } = useThreeJS((container) => {
    // Create scene with postprocessing effects
    const { scene, camera, renderer, composer, resize, crtPass, glitchPass } = createThreeSetup(
      container,
      {
        cameraPosition: new THREE.Vector3(0, 0, 5),
        postprocessing: {
          bloom: {
            enabled: false,
            strength: 0.1,
            radius: 0.8,
            threshold: 0.1,
          },
          glitch: {
            enabled: true,
            dtSize: 512, // Increase detail size for less frequent glitches
            colS: 0,
          },
          crt: {
            enabled: true,
          },
        },
      }
    )

    // Set renderer clear color to make background visible
    renderer.setClearColor(0x000000, 0.1)

    // Set renderer clear color to make background visible
    renderer.setClearColor(0x000000, 0.1)

    // Add ambient light with increased intensity
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0)
    scene.add(ambientLight)

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5)
    directionalLight.position.set(5, 5, 5)
    scene.add(directionalLight)

    // Add a point light to better illuminate the placeholder
    const pointLight = new THREE.PointLight(0xffffff, 1.0)
    pointLight.position.set(0, 0, 5)
    scene.add(pointLight)

    // Create ticket mesh placeholder (will be replaced when texture loads)

    const planeGeometrySize = [12, 6]
    const placeholderGeometry = new THREE.PlaneGeometry(...planeGeometrySize)
    const placeholderMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
    })
    // Use a more generic type for ticket to allow reassignment to either Mesh or Group
    let ticket: THREE.Object3D = new THREE.Mesh(placeholderGeometry, placeholderMaterial)

    scene.add(ticket)

    // Ensure the ticket is visible in the camera's view
    ticket.position.z = 0

    // Load the ticket texture and create the actual ticket mesh
    // Replace this URL with your actual ticket texture
    const ticketTextureUrl = '/images/launchweek/14/bilet-supabase.glb'

    createTicketMesh(ticketTextureUrl, ...planeGeometrySize)
      .then((ticketModel) => {
        // Remove placeholder and add the actual ticket model
        scene.remove(ticket)
        scene.add(ticketModel)

        // Store reference to the new ticket for animation
        if (ticket instanceof THREE.Mesh) {
          ticket.geometry.dispose()
          if (Array.isArray(ticket.material))
            ticket.material.forEach((material) => material.dispose())
          else ticket.material.dispose()
        }

        // Update the ticket reference
        ticket = ticketModel
      })
      .catch((error) => {
        console.error('Failed to load ticket texture:', error)
      })

    // Add window resize listener
    window.addEventListener('resize', resize)

    // Mouse movement tracking for glitch effect and ticket following
    let lastMouseX = 0
    let lastMouseY = 0
    let mouseIntensity = 0
    let mouseIntensityDecay = 0.95 // How quickly the intensity decays

    // For mouse tracking of ticket
    let mouseX = 0
    let mouseY = 0
    let targetX = 0
    let targetY = 0

    const handleMouseMove = (event: MouseEvent) => {
      // Calculate mouse movement distance for glitch effect
      const dx = event.clientX - lastMouseX
      const dy = event.clientY - lastMouseY
      const distance = Math.sqrt(dx * dx + dy * dy)

      // Update intensity based on movement (clamped between 0 and 1)
      mouseIntensity = Math.max(0, mouseIntensity + distance * 0.005)

      // Update last position
      lastMouseX = event.clientX
      lastMouseY = event.clientY

      // Update glitch intensity
      if (glitchPass) {
        glitchPass.setIntensity(mouseIntensity)
      }

      // Calculate normalized mouse position for ticket following
      // Convert from screen coordinates to normalized device coordinates (-1 to +1)
      const rect = container.getBoundingClientRect()
      mouseX = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1
      mouseY = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1

      // Scale down the effect for subtle movement
      targetX = mouseX * 0.5
      targetY = mouseY * 0.3
    }

    // Make the container element respond to pointer events
    container.style.pointerEvents = 'auto'

    // Add mouse event listeners
    container.addEventListener('mousemove', handleMouseMove)

    // Animation function

    const animate = (time?: number) => {
      const currentTime = time || 0

      // if (ticket) {
      //   // Add very subtle floating animation with reduced amplitude
      //   const floatingX = Math.sin(currentTime * 0.0003) * 0.05
      //   const floatingY = Math.sin(currentTime * 0.0005) * 0.03
      //
      //   // Smoothly interpolate current position toward target (mouse) position
      //   const lerpFactor = 0.05 // Lower value = smoother/slower follow
      //
      //   // Combine floating animation with mouse following
      //   ticket.rotation.y = floatingX + (targetX * 0.2)
      //   ticket.rotation.x = floatingY + (targetY * -0.2)
      //
      //   // Smoothly move ticket position toward target with easing
      //   ticket.position.x += (targetX - ticket.position.x) * lerpFactor
      //   ticket.position.y += (targetY - ticket.position.y) * lerpFactor + (Math.sin(currentTime * 0.0007) * 0.02)
      // }

      // Update CRT shader time uniform for animation effects
      if (crtPass) {
        crtPass.uniforms.time.value = currentTime
      }

      // Gradually decay mouse intensity when not moving
      if (mouseIntensity > 0) {
        mouseIntensity *= mouseIntensityDecay
        if (mouseIntensity < 0.0000001) {
          mouseIntensity = 0
        }
        if (glitchPass) {
          glitchPass.setIntensity(mouseIntensity)
        }
      }

      // Render with post-processing
      composer.render()
    }

    // Cleanup function
    const cleanup = () => {
      window.removeEventListener('resize', resize)

      // Dispose of all resources
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) object.geometry.dispose()

          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((material) => material.dispose())
            } else {
              object.material.dispose()
            }
          }
        }
      })

      renderer.dispose()
      container.removeChild(renderer.domElement)
    }

    return { cleanup, animate }
  })

  return (
    <div
      className={cn(
        'w-screen absolute inset-0 h-[600px] lg:min-h-full lg:max-h-[1000px] flex justify-center items-center overflow-hidden pointer-events-none',
        className
      )}
    >
      <div ref={containerRef} className="w-full lg:h-full" />
    </div>
  )
}

export { LwCanvas }
