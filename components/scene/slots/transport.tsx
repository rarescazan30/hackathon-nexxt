'use client'

// Transport, tier 1–5: bus stop → bike → old car → newer car → luxury car.
import { Box, Cylinder, Group, PALETTE, Torus } from '../parts'

function BusStop() {
  return (
    <Group>
      <Cylinder radius={0.04} height={1.3} segments={5} color={PALETTE.metal} position={[0, 0.65, 0]} />
      <Box size={[0.45, 0.3, 0.05]} color={PALETTE.sky} position={[0, 1.2, 0]} />
      <Box size={[0.7, 0.08, 0.25]} color={PALETTE.wood} position={[0.5, 0.35, 0]} />
      <Box size={[0.06, 0.35, 0.06]} color={PALETTE.metal} position={[0.25, 0.17, 0]} />
      <Box size={[0.06, 0.35, 0.06]} color={PALETTE.metal} position={[0.75, 0.17, 0]} />
    </Group>
  )
}

function Bike() {
  return (
    <Group rotation={[0, 0.3, 0]}>
      <Torus radius={0.28} tube={0.04} color={PALETTE.ink} position={[-0.42, 0.3, 0]} />
      <Torus radius={0.28} tube={0.04} color={PALETTE.ink} position={[0.42, 0.3, 0]} />
      <Box size={[0.85, 0.05, 0.05]} color={PALETTE.sky} position={[0, 0.45, 0]} rotation={[0, 0, 0.15]} />
      <Box size={[0.05, 0.4, 0.05]} color={PALETTE.sky} position={[-0.12, 0.5, 0]} rotation={[0, 0, -0.3]} />
      <Box size={[0.22, 0.05, 0.1]} color={PALETTE.ink} position={[-0.18, 0.72, 0]} />
      <Box size={[0.05, 0.35, 0.05]} color={PALETTE.metal} position={[0.38, 0.6, 0]} />
      <Box size={[0.05, 0.05, 0.35]} color={PALETTE.metal} position={[0.38, 0.78, 0]} />
    </Group>
  )
}

function Wheels({ x, z, radius = 0.17 }: { x: number; z: number; radius?: number }) {
  return (
    <>
      {[-x, x].flatMap((wx) =>
        [-z, z].map((wz) => (
          <Cylinder key={`${wx}-${wz}`} radius={radius} height={0.12} segments={8} color={PALETTE.ink} position={[wx, radius, wz]} rotation={[Math.PI / 2, 0, 0]} />
        )),
      )}
    </>
  )
}

/** A boxy old Romanian classic. */
function OldCar() {
  return (
    <Group rotation={[0, 0.4, 0]}>
      <Box size={[1.4, 0.38, 0.7]} color={PALETTE.sand} position={[0, 0.35, 0]} />
      <Box size={[0.75, 0.32, 0.62]} color={PALETTE.sand} position={[-0.08, 0.7, 0]} />
      <Box size={[0.65, 0.24, 0.64]} color={PALETTE.glass} position={[-0.08, 0.7, 0]} />
      <Box size={[0.05, 0.08, 0.5]} color={PALETTE.metal} position={[0.72, 0.3, 0]} />
      <Wheels x={0.45} z={0.33} />
    </Group>
  )
}

function NewerCar() {
  return (
    <Group rotation={[0, 0.4, 0]}>
      <Box size={[1.5, 0.34, 0.74]} color={PALETTE.primary} position={[0, 0.34, 0]} />
      <Box size={[0.8, 0.28, 0.66]} color={PALETTE.primary} position={[-0.1, 0.64, 0]} rotation={[0, 0, 0.06]} />
      <Box size={[0.72, 0.22, 0.68]} color={PALETTE.glass} position={[-0.1, 0.64, 0]} rotation={[0, 0, 0.06]} />
      <Box size={[0.04, 0.08, 0.6]} color={PALETTE.white} position={[0.76, 0.38, 0]} />
      <Wheels x={0.5} z={0.35} />
    </Group>
  )
}

function LuxuryCar() {
  return (
    <Group rotation={[0, 0.4, 0]}>
      <Box size={[1.9, 0.26, 0.82]} color={PALETTE.deep} position={[0, 0.3, 0]} />
      <Box size={[0.8, 0.22, 0.7]} color={PALETTE.deep} position={[-0.2, 0.53, 0]} rotation={[0, 0, 0.1]} />
      <Box size={[0.72, 0.16, 0.72]} color={PALETTE.glass} position={[-0.2, 0.54, 0]} rotation={[0, 0, 0.1]} />
      <Box size={[1.92, 0.04, 0.84]} color={PALETTE.gold} position={[0, 0.2, 0]} />
      <Box size={[0.04, 0.06, 0.7]} color={PALETTE.white} position={[0.96, 0.33, 0]} />
      <Wheels x={0.62} z={0.38} radius={0.18} />
    </Group>
  )
}

export function Transport({ tier }: { tier: number }) {
  switch (tier) {
    case 1:
      return <BusStop />
    case 2:
      return <Bike />
    case 3:
      return <OldCar />
    case 4:
      return <NewerCar />
    default:
      return <LuxuryCar />
  }
}
