'use client'

// The floating low-poly island everything stands on, plus a path and two clouds.
import { Ball, Box, Cylinder, Group, PALETTE, Tree } from './parts'

export const ISLAND_RADIUS = 3.7

export function Ground() {
  return (
    <Group>
      <Cylinder radius={ISLAND_RADIUS} height={0.35} segments={10} color={PALETTE.grass} position={[0, -0.175, 0]} />
      <Cylinder radius={ISLAND_RADIUS * 0.72} topRadius={ISLAND_RADIUS} height={1.1} segments={10} color={PALETTE.lavender} position={[0, -0.9, 0]} />
      <Cylinder radius={ISLAND_RADIUS * 0.3} topRadius={ISLAND_RADIUS * 0.72} height={0.8} segments={10} color={PALETTE.primary} position={[0, -1.85, 0]} />

      {/* stepping stones from the front door to the edge */}
      {[0.3, 0.9, 1.5, 2.1, 2.7].map((z, i) => (
        <Box key={z} size={[0.42, 0.04, 0.3]} color={PALETTE.sand} position={[i % 2 ? 0.08 : -0.08, 0.02, z - 0.6]} />
      ))}

      {/* fixed decoration in the empty corner */}
      <Tree position={[-2.0, 0, -1.9]} height={1.1} color={PALETTE.grassDark} />
      <Tree position={[-2.7, 0, -0.9]} height={0.8} color={PALETTE.grassDark} />

      <Group position={[-2.0, 3.0, 1.0]}>
        <Ball radius={0.35} color={PALETTE.white} />
        <Ball radius={0.28} color={PALETTE.white} position={[0.4, -0.05, 0]} />
        <Ball radius={0.22} color={PALETTE.white} position={[-0.35, -0.08, 0.05]} />
      </Group>
      <Group position={[2.2, 2.7, -1.8]}>
        <Ball radius={0.28} color={PALETTE.white} />
        <Ball radius={0.22} color={PALETTE.white} position={[0.32, -0.04, 0]} />
      </Group>
    </Group>
  )
}
