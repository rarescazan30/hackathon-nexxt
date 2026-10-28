// /i/<code>: someone shared their retirement island. A pop-up with their island, first
// name and level, and one button to start your own. Public: no login needed.
import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { X } from 'lucide-react'
import { getShareCard } from '@/lib/data/share-card'
import { Logo } from '@/components/app/shell'
import { LifestyleScene } from '@/components/scene'

export async function generateMetadata({ params }: PageProps<'/i/[code]'>): Promise<Metadata> {
  const { code } = await params
  const card = await getShareCard(code)
  if (!card) return { title: 'LifeGrowth' }

  const title = `${card.firstName}'s retirement island · Level ${card.level}`
  const description = 'See how you will live in retirement, and start saving for your pension with LifeGrowth'
  const images = card.imageUrl ? [{ url: card.imageUrl, width: 1200, height: 630, alt: title }] : undefined
  return {
    title,
    description,
    openGraph: { title, description, type: 'website', siteName: 'LifeGrowth', images },
    twitter: { card: images ? 'summary_large_image' : 'summary', title, description, images: images?.map((image) => image.url) },
  }
}

export default function SharedIslandPage({ params }: PageProps<'/i/[code]'>) {
  return (
    <main className="min-h-screen bg-[#f7f6f9] text-[#292431] dark:bg-[#18151f] dark:text-[#f8f6fb]">
      <div className="mx-auto w-full max-w-[960px] px-5 pt-6">
        <Link href="/" aria-label="LifeGrowth home">
          <Logo />
        </Link>
      </div>
      <Suspense fallback={null}>
        <SharedIsland params={params} />
      </Suspense>
    </main>
  )
}

async function SharedIsland({ params }: Pick<PageProps<'/i/[code]'>, 'params'>) {
  const { code } = await params
  const card = await getShareCard(code)
  if (!card) notFound()

  return (
    // The pop-up: a dimmed backdrop and one card in the middle.
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#18151f]/40 px-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="shared-title">
      <div className="relative w-full max-w-[400px] overflow-hidden rounded-[28px] bg-white shadow-[0_24px_60px_rgba(24,21,31,.25)] animate-in fade-in zoom-in-95 duration-300 dark:bg-[#211d2b]">
        <Link href="/" aria-label="Close" className="absolute right-4 top-4 z-10 flex size-9 items-center justify-center rounded-full bg-white/90 text-[#33256c] shadow-sm dark:bg-[#292333] dark:text-white">
          <X size={17} />
        </Link>
        <LifestyleScene slots={card.slots} />
        <div className="flex flex-col items-center gap-3 px-6 pb-6 text-center">
          <span className="rounded-full bg-[#f1effa] px-3 py-1 text-xs font-semibold text-[#5f4bb6] dark:bg-[#2b253a] dark:text-[#a594f0]">
            Level {card.level}
          </span>
          <h1 id="shared-title" className="text-[24px] font-semibold leading-tight tracking-[-.03em]">
            {card.firstName}&rsquo;s retirement island
          </h1>
          <p className="text-sm leading-6 text-[#706b7b] dark:text-[#aaa4b6]">How will you live in retirement? Find out in a minute.</p>
          <Link href="/register" className="pulse-hover mt-1 w-full rounded-xl bg-[#33256c] py-3 text-sm font-semibold text-white">
            Start saving for your pension
          </Link>
        </div>
      </div>
    </div>
  )
}
