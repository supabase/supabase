'use client'

import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
// import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// TODO: add content in ticket and subtract it from shape

const ThreeCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const isDesktop = window.innerWidth > 768

    // Initialize scene, camera, and renderer
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      75,
      isDesktop
        ? window.innerWidth / 2 / window.innerHeight
        : window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(isDesktop ? window.innerWidth / 2 : window.innerWidth, window.innerHeight)
    canvasRef.current.appendChild(renderer.domElement)

    // Controls
    const controls = new OrbitControls(camera, canvasRef.current)
    controls.target.set(0, 0.75, 0)
    controls.autoRotate
    // controls.enableRotate = false
    controls.enableDamping = true
    controls.enableZoom = false
    controls.dampingFactor = 0.1
    controls.minPolarAngle = Math.PI / 2
    controls.maxPolarAngle = Math.PI / 2

    // Create a metal material
    const metalTexture = new THREE.TextureLoader().load('/images/launchweek/13/ticket/2000px.avif') // Load a metal texture image
    const metalMaterial = new THREE.MeshStandardMaterial({
      map: metalTexture,
      color: 0x9ea1a1,
      metalness: 0.8,
      roughness: 0.35,
    })

    // Environment Map
    // const rgbeLoader = new RGBELoader()
    // rgbeLoader.load('/images/launchweek/13/ticket/octagon_lamps_photo_studio_1k.hdr', (texture) => {
    //   (texture) => {
    //     texture.mapping = THREE.EquirectangularReflectionMapping

    //     scene.environment = texture

    //     metalMaterial.envMap = texture
    //     metalMaterial.envMapIntensity = 9
    //   }
    // )

    // Load 3D model
    const loader = new GLTFLoader()
    let ticket3DImport: THREE.Object3D<THREE.Event> | null = null

    loader.load(
      '/images/launchweek/13/ticket/3D-ticket.glb',
      (gltf) => {
        console.log('success', gltf)
        ticket3DImport = gltf.scene.children[0]

        ticket3DImport.rotation.x = -Math.PI * 0.5
        ticket3DImport.traverse((child) => {
          if (child) {
            child.traverse((node) => {
              if ((node as THREE.Mesh).isMesh) {
                ;(child as THREE.Mesh).material = metalMaterial
              }
            })
          }
        })

        scene.add(ticket3DImport)
        camera.lookAt(ticket3DImport.position)
      },
      (progress) => {
        console.error('progress', progress)
      },
      (error) => {
        console.error('An error happened', error)
      }
    )

    // Position the camera to see the plate vertically
    camera.position.z = 30

    // Add realistic lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 20) // Soft ambient light
    scene.add(ambientLight)

    // Top right light
    const topRightLight = new THREE.DirectionalLight(0xffffff, 2)
    topRightLight.position.set(10, 20, 10)
    scene.add(topRightLight)

    // Bottom left light
    const bottomLeftLight = new THREE.DirectionalLight(0xffffff, 2)
    bottomLeftLight.position.set(-5, -25, 10)
    scene.add(bottomLeftLight)

    // Left light
    const leftLight = new THREE.PointLight(0xffffff, 0.015)
    leftLight.position.set(50, 0, 100)

    scene.add(leftLight)

    // Right light
    const rightLight = new THREE.PointLight(0xffffff, 0.015)
    rightLight.position.set(-50, 0, 100)
    scene.add(rightLight)

    let orbit: THREE.Object3D

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)

      // plate.rotation.y += 0.005 // slow rotation
      renderer.render(scene, camera)
    }
    animate()

    // Handle window resize
    const handleResize = () => {
      const isDesktop = window.innerWidth > 768
      camera.aspect = isDesktop
        ? window.innerWidth / 2 / window.innerHeight
        : window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(isDesktop ? window.innerWidth / 2 : window.innerWidth, window.innerHeight)
    }

    // orbit object on mousemove
    const handleMouseMoveRotate = (e: any) => {
      let scale = -0.001
      orbit.rotateY((e.movementX - 1) * scale)
      orbit.rotateX(e.movementY * scale * 0.5)
      orbit.rotation.z = 0
      // TODO: reset initial rotation when mouse leaves the canvas
    }

    //the camera rotation pivot
    orbit = new THREE.Object3D()
    orbit.rotation.order = 'YXZ' //this is important to keep level, so Z should be the last axis to rotate in order...
    // orbit.position.copy( ticket.position );
    scene.add(orbit)

    //offset the camera and add it to the pivot
    //you could adapt the code so that you can 'zoom' by changing the z value in camera.position in a mousewheel event..
    let cameraDistance = 30
    camera.position.z = cameraDistance
    orbit.add(camera)

    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMoveRotate)

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMoveRotate)
      canvasRef.current?.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [])

  return (
    <div className="relative flex justify-end items-center max-h-screen bg-alternative overflow-hidden">
      <div ref={canvasRef} className="w-full md:w-1/2 h-full" />
    </div>
  )
}

export default ThreeCanvas
