'use client'

// Home, tier 1–5: tent → small block of flats → family house → modern house → villa.
import { Box, Cone, Cylinder, Group, PALETTE } from '../parts'

function Tent() {
  return (
    <Group>
      <Cone radius={0.95} height={1.1} segments={4} color={PALETTE.peach} position={[0, 0.55, 0]} rotation={[0, Math.PI / 4, 0]} />
      <Box size={[0.36, 0.5, 0.05]} color={PALETTE.ink} position={[0, 0.25, 0.47]} />
      {/* campfire */}
      <Cone radius={0.16} height={0.3} segments={5} color={PALETTE.red} position={[0.95, 0.15, 0.6]} />
      <Box size={[0.4, 0.06, 0.08]} color={PALETTE.woodDark} position={[0.95, 0.03, 0.6]} rotation={[0, 0.6, 0]} />
      <Box size={[0.4, 0.06, 0.08]} color={PALETTE.woodDark} position={[0.95, 0.03, 0.6]} rotation={[0, -0.6, 0]} />
    </Group>
  )
}

function Windows({ rows, cols, width, height, z, y0 = 0.35, color = PALETTE.glass }: { rows: number; cols: number; width: number; height: number; z: number; y0?: number; color?: string }) {
  const windows = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = cols === 1 ? 0 : -width / 2 + (width / (cols - 1)) * c
      windows.push(<Box key={`${r}-${c}`} size={[0.2, 0.22, 0.04]} color={color} position={[x, y0 + (height / Math.max(1, rows)) * r, z]} />)
    }
  }
  return <>{windows}</>
}

function SmallFlat() {
  return (
    <Group>
      <Box size={[1.3, 1.9, 1.1]} color={PALETTE.stone} position={[0, 0.95, 0]} />
      <Box size={[1.4, 0.08, 1.2]} color={PALETTE.metal} position={[0, 1.94, 0]} />
      <Windows rows={4} cols={3} width={0.8} height={1.7} z={0.56} y0={0.35} />
      <Box size={[0.3, 0.45, 0.05]} color={PALETTE.woodDark} position={[0, 0.22, 0.56]} />
    </Group>
  )
}

function FamilyHouse() {
  return (
    <Group>
      <Box size={[1.6, 1, 1.3]} color={PALETTE.white} position={[0, 0.5, 0]} />
      {/* gable roof: a 3-sided cylinder lying on its side */}
      <Cylinder radius={0.95} height={1.8} segments={3} color={PALETTE.red} position={[0, 1.3, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.78]} />
      <Box size={[0.32, 0.55, 0.05]} color={PALETTE.wood} position={[0, 0.28, 0.66]} />
      <Windows rows={1} cols={2} width={1} height={0} z={0.66} y0={0.6} />
      <Box size={[0.18, 0.5, 0.18]} color={PALETTE.stone} position={[0.5, 1.65, -0.2]} />
    </Group>
  )
}

function ModernHouse() {
  return (
    <Group>
      <Box size={[1.9, 0.9, 1.4]} color={PALETTE.white} position={[0, 0.45, 0]} />
      <Box size={[1.3, 0.8, 1.2]} color={PALETTE.soft} position={[-0.25, 1.3, -0.1]} />
      <Box size={[2.0, 0.07, 1.5]} color={PALETTE.deep} position={[0, 0.93, 0]} />
      <Box size={[1.4, 0.07, 1.3]} color={PALETTE.deep} position={[-0.25, 1.73, -0.1]} />
      <Box size={[1.0, 0.6, 0.04]} color={PALETTE.glass} position={[-0.3, 0.42, 0.71]} />
      <Box size={[0.8, 0.5, 0.04]} color={PALETTE.glass} position={[-0.25, 1.3, 0.51]} />
      <Box size={[0.35, 0.6, 0.05]} color={PALETTE.woodDark} position={[0.6, 0.3, 0.71]} />
      {/* garage */}
      <Box size={[0.9, 0.7, 1.1]} color={PALETTE.stone} position={[1.4, 0.35, 0.1]} />
    </Group>
  )
}

function Villa() {
  return (
    <Group>
      <Box size={[2.6, 0.12, 1.9]} color={PALETTE.sand} position={[0, 0.06, 0]} />
      <Box size={[2.3, 1.0, 1.5]} color={PALETTE.white} position={[0, 0.62, -0.05]} />
      <Box size={[1.5, 0.9, 1.3]} color={PALETTE.white} position={[0.35, 1.57, -0.15]} />
      <Box size={[2.5, 0.08, 1.7]} color={PALETTE.gold} position={[0, 1.14, -0.05]} />
      <Box size={[1.7, 0.08, 1.5]} color={PALETTE.gold} position={[0.35, 2.05, -0.15]} />
      <Box size={[1.9, 0.7, 0.04]} color={PALETTE.glass} position={[0, 0.6, 0.71]} />
      <Box size={[1.2, 0.6, 0.04]} color={PALETTE.glass} position={[0.35, 1.55, 0.51]} />
      {[-1.05, -0.35, 0.35, 1.05].map((x) => (
        <Cylinder key={x} radius={0.06} height={1.0} segments={6} color={PALETTE.white} position={[x, 0.62, 0.85]} />
      ))}
      <Box size={[2.4, 0.06, 0.3]} color={PALETTE.white} position={[0, 1.14, 0.85]} />
    </Group>
  )
}

export function Home({ tier }: { tier: number }) {
  switch (tier) {
    case 1:
      return <Tent />
    case 2:
      return <SmallFlat />
    case 3:
      return <FamilyHouse />
    case 4:
      return <ModernHouse />
    default:
      return <Villa />
  }
}
