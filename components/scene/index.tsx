'use client'

// Public entry for the scene. three.js only loads in the browser, in its own chunk.
import dynamic from 'next/dynamic'

export type { LifestyleSceneProps } from './lifestyle-scene'
export { SLOT_LABELS, SLOT_NAMES, slotLabel } from './slot-labels'

export const LifestyleScene = dynamic(() => import('./lifestyle-scene').then((m) => m.LifestyleScene), {
  ssr: false,
  loading: () => <div className="aspect-square w-full animate-pulse rounded-[24px] bg-[#e8e2fb]/50 dark:bg-[#2b253a]/50" />,
})
