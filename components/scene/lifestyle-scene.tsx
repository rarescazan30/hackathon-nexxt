'use client'

// The retirement lifestyle scene: an island with 4 slots (home, transport, food, extras),
// each drawn at its tier 1–5. Import it through components/scene/index.tsx (client-only).
import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import type { Group as ThreeGroup } from 'three'
import { SLOTS, type Slot, type SlotTiers } from '@/lib/rules/lifestyle'
import { Ground } from './ground'
import { Ball, PALETTE } from './parts'
import { SceneFallback } from './scene-fallback'
import { Extras } from './slots/extras'
import { Food } from './slots/food'
import { Home } from './slots/home'
import { Transport } from './slots/transport'

export interface LifestyleSceneProps {
  slots: SlotTiers
  /** The slot that just changed: it pops in with sparkles (level-up moment). */
  highlight?: Slot | null
  className?: string
  /** Keep the last frame readable, so "Share my island" can take a picture of it. */
  snapshot?: boolean
}

const SLOT_POSITIONS: Record<Slot, [number, number, number]> = {
  home: [0, 0, -1.0],
  transport: [1.4, 0, 1.7],
  food: [-1.6, 0, 1.3],
  extras: [2.4, 0, -0.4],
}

const SLOT_MODELS = { home: Home, transport: Transport, food: Food, extras: Extras }

const IDLE_TURN_SPEED = 0.12 // radians per second
const DRAG_TURN_PER_PIXEL = 0.012 // radians per pixel dragged
const DRAG_FRICTION = 4 // how fast a flick slows down (per second)
const RESUME_AFTER_DRAG_MS = 2000 // the idle turn comes back this long after letting go
const POP_SECONDS = 0.7
const SPARKLE_SECONDS = 1.4
const CAMERA_FIT = 8.6 // world units that fit across the smaller side of the canvas

/** easeOutBack: overshoots a little, then settles at 1. */
function popScale(t: number) {
  const c = 1.7
  const x = Math.min(1, Math.max(0, t)) - 1
  return 1 + (c + 1) * x * x * x + c * x * x
}

/** Keeps the whole island in view whatever the canvas size. */
function FitCamera() {
  const getState = useThree((state) => state.get)
  const size = useThree((state) => state.size)
  useEffect(() => {
    // Read the camera from the store: three.js objects are meant to be mutated.
    const { camera } = getState()
    camera.zoom = Math.min(size.width, size.height) / CAMERA_FIT
    camera.updateProjectionMatrix()
  }, [getState, size])
  return null
}

function Sparkles() {
  const ref = useRef<ThreeGroup>(null)
  const started = useRef<number | null>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    started.current ??= clock.elapsedTime
    const t = (clock.elapsedTime - started.current) / SPARKLE_SECONDS
    ref.current.visible = t < 1
    ref.current.position.y = 0.5 + t * 1.6
    ref.current.rotation.y = t * 3
    ref.current.scale.setScalar(Math.max(0, 1 - t))
  })
  return (
    <group ref={ref}>
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2
        return <Ball key={i} radius={0.08} color={i % 2 ? PALETTE.gold : PALETTE.white} position={[Math.cos(angle) * 0.9, (i % 3) * 0.25, Math.sin(angle) * 0.9]} />
      })}
    </group>
  )
}

/** One slot; it pops in whenever its tier changes, or when it is the highlighted slot. */
function SlotModel({ slot, tier, highlighted }: { slot: Slot; tier: number; highlighted: boolean }) {
  const ref = useRef<ThreeGroup>(null)
  const popStart = useRef<number | null>(null)
  const Model = SLOT_MODELS[slot]

  // A new tier (or a highlight) restarts the pop on the next frame.
  useEffect(() => {
    popStart.current = null
  }, [tier, highlighted])

  useFrame(({ clock }) => {
    if (!ref.current) return
    popStart.current ??= clock.elapsedTime
    ref.current.scale.setScalar(popScale((clock.elapsedTime - popStart.current) / POP_SECONDS))
  })

  return (
    <group position={SLOT_POSITIONS[slot]}>
      <group ref={ref}>
        <Model tier={tier} />
      </group>
      {highlighted && <Sparkles key={tier} />}
    </group>
  )
}

function Island({ slots, highlight, turning }: { slots: SlotTiers; highlight: Slot | null; turning: boolean }) {
  const ref = useRef<ThreeGroup>(null)
  const canvas = useThree((state) => state.gl.domElement)
  // What the pointer did since the last frame; written by DOM events, read by the render loop.
  const drag = useRef({ dragging: false, lastX: 0, pendingTurn: 0, spin: 0, releasedAt: 0 })

  // Drag left / right to spin the island. Only horizontal: vertical swipes still scroll the page.
  useEffect(() => {
    const down = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId)
      drag.current = { ...drag.current, dragging: true, lastX: e.clientX, spin: 0 }
    }
    const move = (e: PointerEvent) => {
      if (!drag.current.dragging) return
      drag.current.pendingTurn += (e.clientX - drag.current.lastX) * DRAG_TURN_PER_PIXEL
      drag.current.lastX = e.clientX
    }
    const up = () => {
      drag.current.dragging = false
      drag.current.releasedAt = performance.now()
    }
    canvas.addEventListener('pointerdown', down)
    canvas.addEventListener('pointermove', move)
    canvas.addEventListener('pointerup', up)
    canvas.addEventListener('pointercancel', up)
    return () => {
      canvas.removeEventListener('pointerdown', down)
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerup', up)
      canvas.removeEventListener('pointercancel', up)
    }
  }, [canvas])

  useFrame((_, delta) => {
    if (!ref.current) return
    const d = drag.current
    if (d.dragging) {
      // Follow the finger exactly; remember the speed for the flick.
      ref.current.rotation.y += d.pendingTurn
      d.spin = delta > 0 ? d.pendingTurn / delta : 0
      d.pendingTurn = 0
      return
    }
    // After letting go: the flick slows down, then the slow idle turn comes back.
    ref.current.rotation.y += d.spin * delta
    d.spin *= Math.exp(-DRAG_FRICTION * delta)
    if (turning && performance.now() - d.releasedAt > RESUME_AFTER_DRAG_MS) ref.current.rotation.y += delta * IDLE_TURN_SPEED
  })
  return (
    <group ref={ref} rotation={[0, -0.35, 0]}>
      <Ground />
      {SLOTS.map((slot) => (
        <SlotModel key={slot} slot={slot} tier={slots[slot]} highlighted={highlight === slot} />
      ))}
    </group>
  )
}

export function LifestyleScene({ slots, highlight = null, className = '', snapshot = false }: LifestyleSceneProps) {
  const container = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(true)
  const [reducedMotion, setReducedMotion] = useState(false)

  // Stop rendering when the scene is scrolled out of view (saves battery on phones).
  useEffect(() => {
    if (!container.current) return
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting))
    observer.observe(container.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return (
    <div
      ref={container}
      className={`relative aspect-square w-full cursor-grab touch-pan-y select-none active:cursor-grabbing ${className}`}
    >
      <Canvas
        gl={{ preserveDrawingBuffer: snapshot }}
        orthographic
        shadows
        dpr={[1, 1.5]}
        frameloop={visible ? 'always' : 'never'}
        camera={{ position: [8, 5.2, 8], zoom: 40, near: 0.1, far: 100 }}
        fallback={<SceneFallback slots={slots} />}
        aria-label="Your retirement lifestyle scene"
      >
        <FitCamera />
        <hemisphereLight args={['#ffffff', '#b9aee6', 0.9]} />
        <directionalLight
          position={[5, 9, 4]}
          intensity={1.6}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-6}
          shadow-camera-right={6}
          shadow-camera-top={6}
          shadow-camera-bottom={-6}
        />
        <Island slots={slots} highlight={highlight} turning={!reducedMotion} />
      </Canvas>
    </div>
  )
}
