'use client'

// Building blocks for the low-poly scene: flat-shaded primitives in the app palette.
// Every model in slots/ is made only from these, so the whole scene has one look.
import type { ReactNode } from 'react'

type Vec3 = [number, number, number]

interface PartProps {
  color: string
  position?: Vec3
  rotation?: Vec3
  scale?: Vec3
}

// The app's purples, the mint used for growth, the sky accent, and a few warm tones.
export const PALETTE = {
  deep: '#33256c',
  primary: '#6f5cc1',
  lavender: '#8c7ad9',
  soft: '#e8e2fb',
  white: '#fbfaff',
  grass: '#a8dcb9',
  grassDark: '#6fbf8e',
  mint: '#bfe8d1',
  leaf: '#55a477',
  sky: '#38bdf8',
  glass: '#bfe6fb',
  wood: '#b98a5e',
  woodDark: '#8a6342',
  sand: '#f0d9b5',
  peach: '#f0b583',
  stone: '#c9c3d6',
  metal: '#a8a1b5',
  ink: '#292431',
  red: '#e2725b',
  gold: '#e8b84a',
} as const

function Material({ color }: { color: string }) {
  return <meshStandardMaterial color={color} flatShading roughness={0.85} metalness={0.05} />
}

export function Box({ size, ...props }: PartProps & { size: Vec3 }) {
  return (
    <mesh position={props.position} rotation={props.rotation} scale={props.scale} castShadow receiveShadow>
      <boxGeometry args={size} />
      <Material color={props.color} />
    </mesh>
  )
}

/** Cylinder; `segments` 3 = triangular prism, 4 = square, 6–8 = low-poly round. */
export function Cylinder({ radius, height, segments = 8, topRadius, ...props }: PartProps & { radius: number; height: number; segments?: number; topRadius?: number }) {
  return (
    <mesh position={props.position} rotation={props.rotation} scale={props.scale} castShadow receiveShadow>
      <cylinderGeometry args={[topRadius ?? radius, radius, height, segments]} />
      <Material color={props.color} />
    </mesh>
  )
}

export function Cone({ radius, height, segments = 6, ...props }: PartProps & { radius: number; height: number; segments?: number }) {
  return (
    <mesh position={props.position} rotation={props.rotation} scale={props.scale} castShadow receiveShadow>
      <coneGeometry args={[radius, height, segments]} />
      <Material color={props.color} />
    </mesh>
  )
}

/** Low-poly ball (icosahedron): fruit, bushes, clouds, tree crowns. */
export function Ball({ radius, detail = 0, ...props }: PartProps & { radius: number; detail?: number }) {
  return (
    <mesh position={props.position} rotation={props.rotation} scale={props.scale} castShadow receiveShadow>
      <icosahedronGeometry args={[radius, detail]} />
      <Material color={props.color} />
    </mesh>
  )
}

export function Torus({ radius, tube, ...props }: PartProps & { radius: number; tube: number }) {
  return (
    <mesh position={props.position} rotation={props.rotation} scale={props.scale} castShadow>
      <torusGeometry args={[radius, tube, 4, 10]} />
      <Material color={props.color} />
    </mesh>
  )
}

export function Group({ children, position, rotation, scale }: { children: ReactNode; position?: Vec3; rotation?: Vec3; scale?: number }) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {children}
    </group>
  )
}

/** A low-poly tree: trunk + stacked cones. Used by several slots. */
export function Tree({ position, height = 1.2, color = PALETTE.leaf }: { position: Vec3; height?: number; color?: string }) {
  return (
    <Group position={position}>
      <Cylinder radius={0.08} height={height * 0.4} segments={5} color={PALETTE.woodDark} position={[0, height * 0.2, 0]} />
      <Cone radius={height * 0.38} height={height * 0.55} color={color} position={[0, height * 0.55, 0]} />
      <Cone radius={height * 0.28} height={height * 0.45} color={color} position={[0, height * 0.82, 0]} />
    </Group>
  )
}
