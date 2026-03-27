'use client'

import { Suspense, useMemo, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, ContactShadows, Environment } from '@react-three/drei'
import * as THREE from 'three'
import type { GLTF } from 'three-stdlib'

const MODEL_PATH = '/models/accord.glb'

function AccordModel({ onLoad }: { onLoad?: () => void }) {
  const { scene: originalScene } = useGLTF(MODEL_PATH) as GLTF

  const materials = useMemo(() => ({
    body: new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x3a3a42),
      metalness: 0.8,
      roughness: 0.2,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      envMapIntensity: 1.5,
    }),
    glass: new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x111115),
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.6,
      thickness: 0.5,
      envMapIntensity: 2.0,
      ior: 1.5,
    }),
    dark: new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x1a1a1e),
      metalness: 0.6,
      roughness: 0.4,
      envMapIntensity: 0.8,
    }),
  }), [])

  const model = useMemo(() => {
    const clone = originalScene.clone(true)
    clone.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      const name = child.name.toLowerCase()
      if (name.startsWith('material3')) child.material = materials.glass
      else if (name.startsWith('material4') || name.startsWith('material5'))
        child.material = materials.dark
      else child.material = materials.body
    })
    const box = new THREE.Box3().setFromObject(clone)
    const center = box.getCenter(new THREE.Vector3())
    clone.position.sub(center)
    clone.position.y += box.getSize(new THREE.Vector3()).y * 0.5
    return clone
  }, [originalScene, materials])

  useEffect(() => {
    onLoad?.()
    const mats = materials
    return () => { Object.values(mats).forEach((m) => m.dispose()) }
  }, [materials, onLoad])

  return <primitive object={model} />
}

// Diagnostic heartbeat -- faint green pulse in the reflections
function DiagnosticPulse() {
  const lightRef = useRef<THREE.PointLight>(null)

  useFrame(({ clock }) => {
    if (!lightRef.current) return
    const t = clock.getElapsedTime()
    // Slow breathing: 6 second cycle, eased sine
    const raw = Math.sin(t * 0.52) * 0.5 + 0.5
    const eased = raw * raw // ease-in for softer pulse
    lightRef.current.intensity = eased * 1.2
  })

  return (
    <pointLight
      ref={lightRef}
      position={[-1.2, 1.5, 0]}
      color="#4ade80"
      distance={6}
      decay={2}
      intensity={0}
    />
  )
}

// Cinematic multi-angle camera sweep
const CAMERA_KEYFRAMES: { pos: [number, number, number]; lookAt: [number, number, number]; duration: number }[] = [
  // Low front three-quarter -- dramatic grille shot
  { pos: [2.5, 0.6, 3.5], lookAt: [-1.2, 0.1, 0], duration: 6 },
  // Rise to elevated side profile
  { pos: [-0.5, 2.8, 4.8], lookAt: [-1.2, 0, 0], duration: 5 },
  // Sweep to rear three-quarter high
  { pos: [-4.5, 2.2, 2.0], lookAt: [-1.2, 0.2, 0], duration: 5 },
  // Low rear shot
  { pos: [-4.0, 0.5, -2.5], lookAt: [-1.2, 0.3, 0], duration: 5 },
  // Wide front reveal
  { pos: [1.0, 1.5, -4.5], lookAt: [-1.2, 0, 0], duration: 5 },
  // Close front quarter -- back to start
  { pos: [3.2, 1.2, 2.8], lookAt: [-1.2, 0.1, 0], duration: 5 },
]

function CinematicCamera() {
  const { camera } = useThree()
  const posVec = useRef(new THREE.Vector3())
  const lookVec = useRef(new THREE.Vector3())
  // Start partway through the first keyframe so the camera begins at a close angle
  const timeRef = useRef(4)
  const totalDuration = useMemo(
    () => CAMERA_KEYFRAMES.reduce((sum, kf) => sum + kf.duration, 0),
    []
  )

  useFrame((_, delta) => {
    timeRef.current += delta
    const t = timeRef.current % totalDuration
    let accumulated = 0
    let fromIdx = 0

    for (let i = 0; i < CAMERA_KEYFRAMES.length; i++) {
      if (t < accumulated + CAMERA_KEYFRAMES[i].duration) {
        fromIdx = i
        break
      }
      accumulated += CAMERA_KEYFRAMES[i].duration
    }

    const toIdx = (fromIdx + 1) % CAMERA_KEYFRAMES.length
    const from = CAMERA_KEYFRAMES[fromIdx]
    const to = CAMERA_KEYFRAMES[toIdx]
    const localT = (t - accumulated) / from.duration

    // Smooth ease in-out
    const eased = localT * localT * (3 - 2 * localT)

    posVec.current.set(
      from.pos[0] + (to.pos[0] - from.pos[0]) * eased,
      from.pos[1] + (to.pos[1] - from.pos[1]) * eased,
      from.pos[2] + (to.pos[2] - from.pos[2]) * eased
    )
    lookVec.current.set(
      from.lookAt[0] + (to.lookAt[0] - from.lookAt[0]) * eased,
      from.lookAt[1] + (to.lookAt[1] - from.lookAt[1]) * eased,
      from.lookAt[2] + (to.lookAt[2] - from.lookAt[2]) * eased
    )

    camera.position.copy(posVec.current)
    camera.lookAt(lookVec.current)
  })

  return null
}

function Scene({ onLoad }: { onLoad?: () => void }) {
  return (
    <>
      <Environment preset="night" background={false} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[6, 5, -2]} intensity={3} color="#ffffff" />
      <directionalLight position={[-5, 4, 3]} intensity={1.5} color="#d8d8ff" />
      <directionalLight position={[-1, 3, 7]} intensity={1.5} color="#e0e0ff" />

      {/* Diagnostic heartbeat -- subtle green pulse */}
      <DiagnosticPulse />

      <Suspense fallback={null}>
        <group position={[-1.2, -0.6, 0]}>
          <AccordModel onLoad={onLoad} />
        </group>

        <ContactShadows
          position={[-1.2, -0.65, 0]}
          opacity={0.25}
          scale={12}
          blur={2.5}
          far={4}
          color="#000000"
        />
      </Suspense>

      <CinematicCamera />
    </>
  )
}

export function CarPreview() {
  const [loaded, setLoaded] = useState(false)

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
      {!loaded && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#050505',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#f0f0f0',
              opacity: 0.4,
              animation: 'car-preview-pulse 1.4s ease-in-out infinite',
            }}
          />
          <style>{`
            @keyframes car-preview-pulse {
              0%, 100% { opacity: 0.15; transform: scale(0.8); }
              50% { opacity: 0.5; transform: scale(1.2); }
            }
          `}</style>
        </div>
      )}
      <Canvas
        camera={{ position: [2.5, 0.6, 3.5], fov: 32, near: 0.1, far: 100 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        dpr={[1, 1.5]}
      >
        <Scene onLoad={() => setLoaded(true)} />
      </Canvas>
    </div>
  )
}

useGLTF.preload(MODEL_PATH)
