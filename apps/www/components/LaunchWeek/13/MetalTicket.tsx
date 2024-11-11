'use client'

import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { useParams } from 'common'

const ThreeCanvas: React.FC<{ username: string }> = ({ username = 'Francesco Sansalvadore' }) => {
  const params = useParams()
  const canvasRef = useRef<HTMLDivElement>(null)
  const ticketRef = useRef<THREE.Mesh | null>(null)
  const orbitRef = useRef<THREE.Object3D | null>(null)
  const animationFrameRef = useRef<number>()
  const targetRotation = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const textLines = params?.username?.split(' ').reverse() || username?.split(' ').reverse() || []
  const LINE_HEIGHT = 1.4

  useEffect(() => {
    if (!canvasRef.current) return

    const isDesktop = () => window.innerWidth > 768
    const desktopWidth = () => (window.innerWidth / 2) * 3
    const canvasWidth = isDesktop() ? desktopWidth() : window.innerWidth
    const canvasHeight = window.innerHeight

    // Initialize scene, camera, and renderer
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, canvasWidth / canvasHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(canvasWidth, canvasHeight)
    renderer.shadowMap.enabled = true
    canvasRef.current.appendChild(renderer.domElement)

    // Create orbit object for camera rotation
    const orbit = new THREE.Object3D()
    orbit.rotation.order = 'YXZ'
    scene.add(orbit)
    orbitRef.current = orbit

    // Camera setup
    const cameraDistance = 30
    camera.position.z = cameraDistance
    orbit.add(camera)

    // Rest of your existing setup code (loader, materials, etc.)
    const loader = new GLTFLoader()
    const metalTexture = new THREE.TextureLoader().load('/images/launchweek/13/ticket/2000px.avif')
    const metalMaterial = new THREE.MeshStandardMaterial({
      map: metalTexture,
      color: 0x9ea1a1,
      metalness: 0.9,
      roughness: 0.25,
    })

    // Environment Map
    const rgbeLoader = new RGBELoader()
    rgbeLoader.load('/images/launchweek/13/ticket/canary_wharf_1k.hdr', (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping
      scene.environment = texture
      metalMaterial.envMap = texture
      metalMaterial.envMapIntensity = 7
    })

    let ticket3DImport: THREE.Mesh
    const ticketGroup = new THREE.Group()

    loader.load('/images/launchweek/13/ticket/3D-ticket-cutout-no-holes.glb', (gltf) => {
      ticket3DImport = gltf.scene.children[0] as THREE.Mesh
      ticket3DImport.rotation.x = Math.PI * 0.5

      ticket3DImport.traverse((child) => {
        if (child) {
          // @ts-ignore
          child.material = metalMaterial
          child.receiveShadow = true
        }
      })

      ticketGroup.add(ticket3DImport)
      scene.add(ticketGroup)
      ticketRef.current = ticket3DImport
      camera.lookAt(ticket3DImport.position)

      // Load font and add text geometry
      const fontLoader = new FontLoader()
      fontLoader.load('/images/launchweek/13/ticket/Inter_Regular.json', (font) => {
        const textMaterial = new THREE.MeshStandardMaterial({
          color: 0x0f0f0f,
          metalness: 0.8,
          roughness: 0.55,
        })

        ticket3DImport.updateMatrix()

        textLines.map((text, index) => {
          const textGeometry = new TextGeometry(text, {
            font,
            size: 0.95,
            height: 0.4,
          })
          const textMesh = new THREE.Mesh(textGeometry, textMaterial)
          textMesh.updateMatrix()
          textMesh.position.set(-5.8, -5 + LINE_HEIGHT * (index + 1), -0.2)
          textMesh.castShadow = true
          // scene.add(textMesh)
          ticketGroup.add(textMesh)
        })

        const footerContent = [
          {
            text: 'LAUNCH WEEK 13',
            position: { x: -5.8, y: -6.8, z: -0.2 },
            size: 0.59,
          },
          {
            text: '2-6 DEC 2024',
            position: { x: -5.8, y: -7.7, z: -0.2 },
            size: 0.55,
          },
        ]

        footerContent.map((line) => {
          const textGeometry = new TextGeometry(line.text, {
            font,
            size: line.size,
            height: 0.4,
          })
          const textMesh = new THREE.Mesh(textGeometry, textMaterial)
          textMesh.updateMatrix()
          textMesh.position.set(line.position.x, line.position.y, line.position.z)
          textMesh.castShadow = true
          ticketGroup.add(textMesh)
        })
      })
    })

    camera.position.z = 30

    const getTicketScreenPosition = () => {
      if (!ticketRef.current) return null

      const vector = new THREE.Vector3()
      ticketRef.current.getWorldPosition(vector)
      vector.project(camera)

      const x = (vector.x * 0.5 + 0.5) * canvasWidth
      const y = -(vector.y * 0.5 - 0.5) * canvasHeight

      return { x, y }
    }

    // Animation function with smooth transitions
    const animate = () => {
      if (orbitRef.current) {
        // Smooth interpolation
        orbitRef.current.rotation.x +=
          (targetRotation.current.x - orbitRef.current.rotation.x) * 0.1
        orbitRef.current.rotation.y +=
          (targetRotation.current.y - orbitRef.current.rotation.y) * 0.1
        orbitRef.current.rotation.z = 0
      }

      renderer.render(scene, camera)
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    // Start animation
    animate()

    // Mouse movement handler with distance-based sensitivity
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current || !orbitRef.current) return

      // Get canvas bounds
      const canvasRect = canvasRef.current.getBoundingClientRect()

      // Calculate center of the canvas
      const centerX = canvasRect.left + canvasRect.width / 2
      const centerY = canvasRect.top + canvasRect.height / 2

      const ticketPosition = getTicketScreenPosition() || { x: centerX, y: centerY }
      // if (!ticketPosition) return

      // Calculate distance from cursor to center
      // const deltaX = e.clientX - centerX
      // const deltaY = e.clientY - centerY
      const deltaX = e.clientX - (canvasRect.left + ticketPosition.x)
      const deltaY = e.clientY - (canvasRect.top + ticketPosition.y)
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      // Maximum distance for sensitivity calculation (diagonal of the canvas)
      const maxDistance = Math.sqrt(
        Math.pow(canvasRect.width / 2, 2) + Math.pow(canvasRect.height / 2, 2)
      )

      // Calculate sensitivity based on distance (inverse relationship)
      const sensitivity = 0.002 * (1 - Math.min(distance / maxDistance, 1))

      // Update target rotation with distance-based sensitivity
      targetRotation.current.y = deltaX * sensitivity
      targetRotation.current.x = deltaY * sensitivity * 0.3
    }

    // Reset handler with smooth transition
    const resetRotation = () => {
      targetRotation.current = { x: 0, y: 0 }
    }

    // Handle window resize
    const handleResize = () => {
      const newWidth = isDesktop() ? desktopWidth() : window.innerWidth
      camera.aspect = newWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(newWidth, window.innerHeight)
    }

    // Event listeners
    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseout', resetRotation)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseout', resetRotation)

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      canvasRef.current?.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [params])

  return (
    <div className="w-screen relative flex justify-end items-center max-h-screen bg-alternative overflow-hidden">
      <div ref={canvasRef} className="w-full h-full" />
    </div>
  )
}

export default ThreeCanvas
