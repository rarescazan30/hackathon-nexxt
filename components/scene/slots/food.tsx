'use client'

// Food, tier 1–5: canned food → pot on a stove → table with groceries → café table → chef's dinner.
import { Ball, Box, Cone, Cylinder, Group, PALETTE } from '../parts'

function Cans() {
  return (
    <Group>
      {[[-0.2, 0], [0.15, 0.1], [0, -0.25]].map(([x, z]) => (
        <Group key={`${x}-${z}`} position={[x, 0, z]}>
          <Cylinder radius={0.12} height={0.28} segments={8} color={PALETTE.metal} position={[0, 0.14, 0]} />
          <Cylinder radius={0.125} height={0.12} segments={8} color={PALETTE.red} position={[0, 0.14, 0]} />
        </Group>
      ))}
      <Box size={[0.5, 0.06, 0.35]} color={PALETTE.wood} position={[0.1, 0.03, 0.3]} />
    </Group>
  )
}

function Stove() {
  return (
    <Group>
      <Box size={[0.7, 0.45, 0.55]} color={PALETTE.white} position={[0, 0.22, 0]} />
      <Box size={[0.5, 0.05, 0.04]} color={PALETTE.ink} position={[0, 0.3, 0.28]} />
      <Cylinder radius={0.2} height={0.25} segments={8} color={PALETTE.deep} position={[0, 0.58, 0]} />
      <Cylinder radius={0.22} height={0.03} segments={8} color={PALETTE.metal} position={[0, 0.72, 0]} />
      <Ball radius={0.07} color={PALETTE.white} position={[0.05, 0.9, 0]} />
      <Ball radius={0.05} color={PALETTE.white} position={[-0.04, 1.02, 0.03]} />
    </Group>
  )
}

function Table({ width, depth, color = PALETTE.wood }: { width: number; depth: number; color?: string }) {
  const legX = width / 2 - 0.08
  const legZ = depth / 2 - 0.08
  return (
    <Group>
      <Box size={[width, 0.07, depth]} color={color} position={[0, 0.5, 0]} />
      {[-legX, legX].flatMap((x) => [-legZ, legZ].map((z) => <Box key={`${x}-${z}`} size={[0.06, 0.48, 0.06]} color={PALETTE.woodDark} position={[x, 0.24, z]} />))}
    </Group>
  )
}

function Groceries() {
  return (
    <Group>
      <Table width={1.1} depth={0.7} />
      <Box size={[0.35, 0.14, 0.16]} color={PALETTE.peach} position={[-0.25, 0.61, 0]} rotation={[0, 0.3, 0]} />
      <Ball radius={0.08} color={PALETTE.red} position={[0.1, 0.62, 0.12]} />
      <Ball radius={0.08} color={PALETTE.grassDark} position={[0.22, 0.62, -0.05]} />
      <Ball radius={0.08} color={PALETTE.gold} position={[0.05, 0.62, -0.15]} />
      <Cylinder radius={0.06} height={0.3} segments={6} color={PALETTE.white} position={[0.38, 0.69, 0.15]} />
    </Group>
  )
}

function Chair({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <Group position={position} rotation={[0, rotation, 0]}>
      <Box size={[0.32, 0.05, 0.32]} color={PALETTE.white} position={[0, 0.3, 0]} />
      <Box size={[0.32, 0.35, 0.05]} color={PALETTE.white} position={[0, 0.5, -0.15]} />
      <Cylinder radius={0.03} height={0.3} segments={4} color={PALETTE.metal} position={[0, 0.15, 0]} />
    </Group>
  )
}

function Cafe() {
  return (
    <Group>
      <Cylinder radius={0.42} height={0.05} segments={10} color={PALETTE.white} position={[0, 0.52, 0]} />
      <Cylinder radius={0.04} height={0.5} segments={5} color={PALETTE.metal} position={[0, 0.26, 0]} />
      <Cylinder radius={0.03} height={1.3} segments={5} color={PALETTE.metal} position={[0, 0.9, 0]} />
      <Cone radius={0.85} height={0.35} segments={8} color={PALETTE.sky} position={[0, 1.55, 0]} />
      <Cylinder radius={0.12} height={0.02} segments={10} color={PALETTE.soft} position={[-0.15, 0.56, 0.1]} />
      <Cylinder radius={0.12} height={0.02} segments={10} color={PALETTE.soft} position={[0.15, 0.56, -0.1]} />
      <Chair position={[-0.6, 0, 0]} rotation={Math.PI / 2} />
      <Chair position={[0.6, 0, 0]} rotation={-Math.PI / 2} />
    </Group>
  )
}

function ChefDinner() {
  return (
    <Group>
      <Table width={1.6} depth={0.75} color={PALETTE.white} />
      <Box size={[1.65, 0.02, 0.3]} color={PALETTE.deep} position={[0, 0.545, 0]} />
      {/* silver cloche */}
      <Cylinder radius={0.24} height={0.03} segments={10} color={PALETTE.metal} position={[0, 0.56, 0]} />
      <Ball radius={0.2} detail={1} color={PALETTE.metal} position={[0, 0.6, 0]} scale={[1, 0.7, 1]} />
      {[-0.55, 0.55].map((x) => (
        <Group key={x} position={[x, 0, 0]}>
          <Cylinder radius={0.04} height={0.28} segments={6} color={PALETTE.deep} position={[0, 0.68, 0.1]} />
          <Cone radius={0.025} height={0.07} segments={5} color={PALETTE.gold} position={[0, 0.86, 0.1]} />
          <Cylinder radius={0.11} height={0.02} segments={10} color={PALETTE.soft} position={[0, 0.56, -0.15]} />
        </Group>
      ))}
      {/* the chef's hat on a little stand behind the table */}
      <Cylinder radius={0.12} height={0.2} segments={8} color={PALETTE.white} position={[0, 1.15, -0.55]} />
      <Ball radius={0.17} color={PALETTE.white} position={[0, 1.32, -0.55]} />
      <Cylinder radius={0.03} height={0.95} segments={4} color={PALETTE.metal} position={[0, 0.5, -0.55]} />
    </Group>
  )
}

export function Food({ tier }: { tier: number }) {
  switch (tier) {
    case 1:
      return <Cans />
    case 2:
      return <Stove />
    case 3:
      return <Groceries />
    case 4:
      return <Cafe />
    default:
      return <ChefDinner />
  }
}
