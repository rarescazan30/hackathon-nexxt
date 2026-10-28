'use client'

// Extras, tier 1–5: a rock → an old TV → a garden → garden with a swing → a pool with a palm.
import { Ball, Box, Cone, Cylinder, Group, PALETTE, Tree } from '../parts'

function Rock() {
  return (
    <Group>
      <Ball radius={0.3} color={PALETTE.stone} position={[0, 0.15, 0]} scale={[1.2, 0.7, 1]} />
      <Cone radius={0.06} height={0.2} segments={3} color={PALETTE.grassDark} position={[0.35, 0.1, 0.1]} />
      <Cone radius={0.06} height={0.16} segments={3} color={PALETTE.grassDark} position={[-0.3, 0.08, 0.2]} />
    </Group>
  )
}

function Tv() {
  return (
    <Group>
      <Box size={[0.8, 0.35, 0.4]} color={PALETTE.wood} position={[0, 0.18, 0]} />
      <Box size={[0.65, 0.48, 0.42]} color={PALETTE.ink} position={[0, 0.6, 0]} />
      <Box size={[0.5, 0.36, 0.02]} color={PALETTE.sky} position={[0, 0.6, 0.22]} />
      <Box size={[0.02, 0.3, 0.02]} color={PALETTE.metal} position={[0.15, 0.98, 0]} rotation={[0, 0, -0.4]} />
      <Box size={[0.02, 0.3, 0.02]} color={PALETTE.metal} position={[-0.15, 0.98, 0]} rotation={[0, 0, 0.4]} />
    </Group>
  )
}

function Flowers({ position }: { position: [number, number, number] }) {
  return (
    <Group position={position}>
      <Ball radius={0.2} color={PALETTE.grassDark} position={[0, 0.15, 0]} />
      <Ball radius={0.05} color={PALETTE.red} position={[0.1, 0.32, 0.08]} />
      <Ball radius={0.05} color={PALETTE.gold} position={[-0.08, 0.3, 0.1]} />
      <Ball radius={0.05} color={PALETTE.lavender} position={[0, 0.34, -0.08]} />
    </Group>
  )
}

function Garden() {
  return (
    <Group>
      <Tree position={[-0.3, 0, -0.2]} />
      <Tree position={[0.35, 0, 0.1]} height={0.9} />
      <Flowers position={[-0.1, 0, 0.45]} />
    </Group>
  )
}

function Swing() {
  return (
    <Group position={[0.35, 0, 0.2]}>
      <Box size={[0.07, 1.1, 0.07]} color={PALETTE.wood} position={[-0.4, 0.55, 0]} />
      <Box size={[0.07, 1.1, 0.07]} color={PALETTE.wood} position={[0.4, 0.55, 0]} />
      <Box size={[0.9, 0.07, 0.07]} color={PALETTE.wood} position={[0, 1.1, 0]} />
      <Box size={[0.02, 0.6, 0.02]} color={PALETTE.metal} position={[-0.12, 0.78, 0]} />
      <Box size={[0.02, 0.6, 0.02]} color={PALETTE.metal} position={[0.12, 0.78, 0]} />
      <Box size={[0.32, 0.04, 0.16]} color={PALETTE.red} position={[0, 0.48, 0]} />
    </Group>
  )
}

function GardenWithSwing() {
  return (
    <Group>
      <Tree position={[-0.55, 0, -0.35]} height={1.3} />
      <Tree position={[-0.2, 0, -0.65]} height={0.9} />
      <Swing />
      <Flowers position={[-0.5, 0, 0.45]} />
    </Group>
  )
}

function PalmTree({ position }: { position: [number, number, number] }) {
  return (
    <Group position={position}>
      {[0, 1, 2, 3].map((i) => (
        <Cylinder key={i} radius={0.07} topRadius={0.06} height={0.32} segments={5} color={PALETTE.wood} position={[i * 0.03, 0.16 + i * 0.3, 0]} />
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <Box key={i} size={[0.7, 0.03, 0.18]} color={PALETTE.leaf} position={[0.1, 1.25, 0]} rotation={[0, (i * Math.PI * 2) / 5, -0.35]} />
      ))}
    </Group>
  )
}

function Pool() {
  return (
    <Group>
      <Box size={[1.3, 0.16, 0.9]} color={PALETTE.white} position={[0, 0.08, 0]} />
      <Box size={[1.1, 0.04, 0.7]} color={PALETTE.sky} position={[0, 0.15, 0]} />
      <Box size={[0.5, 0.06, 0.22]} color={PALETTE.peach} position={[0.1, 0.05, 0.75]} rotation={[0, 0.2, 0]} />
      <PalmTree position={[-0.75, 0, -0.45]} />
    </Group>
  )
}

export function Extras({ tier }: { tier: number }) {
  switch (tier) {
    case 1:
      return <Rock />
    case 2:
      return <Tv />
    case 3:
      return <Garden />
    case 4:
      return <GardenWithSwing />
    default:
      return <Pool />
  }
}
