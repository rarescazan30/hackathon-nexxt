import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ScenePlayground } from './scene-playground'

export const metadata: Metadata = {
  title: 'LifeGrowth — Scene playground',
}

// /dev/scene: a preview of the 3D scene for building the models. Not part of the product:
// hidden in production builds unless ENABLE_DEV_PAGES=1 is set at build time.
export default function ScenePlaygroundPage() {
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DEV_PAGES !== '1') notFound()
  return <ScenePlayground />
}
