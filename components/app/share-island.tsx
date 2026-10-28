'use client'

// "Share my island": takes a picture of the 3D scene, saves a public link (/i/<code>)
// with first name + level, then opens the phone's share sheet, or shows WhatsApp /
// LinkedIn / Copy link buttons on a computer.
import { useState, useTransition } from 'react'
import { Check, Copy, Share2 } from 'lucide-react'
import { createShareLink } from '@/app/app/actions'

// Link previews (WhatsApp, LinkedIn) use 1200×630 images.
const PREVIEW_WIDTH = 1200
const PREVIEW_HEIGHT = 630
const SCENE_AREA_WIDTH = 640
const SHARE_TEXT = 'This is how I will live in retirement. See yours on LifeGrowth'

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve))

/** The preview card: the island on the left, name and level on the right. */
function previewPicture(scene: HTMLCanvasElement, firstName: string, level: number): Promise<Blob | null> {
  const card = document.createElement('canvas')
  card.width = PREVIEW_WIDTH
  card.height = PREVIEW_HEIGHT
  const ctx = card.getContext('2d')
  if (!ctx) return Promise.resolve(null)

  ctx.fillStyle = '#f1effa'
  ctx.fillRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT)
  // Fit the scene (square or 4:3) into the left 640 × 630 area, keeping its shape.
  const scale = Math.min(SCENE_AREA_WIDTH / scene.width, PREVIEW_HEIGHT / scene.height)
  const drawWidth = scene.width * scale
  const drawHeight = scene.height * scale
  ctx.drawImage(scene, (SCENE_AREA_WIDTH - drawWidth) / 2 + 10, (PREVIEW_HEIGHT - drawHeight) / 2, drawWidth, drawHeight)

  const x = SCENE_AREA_WIDTH + 30
  ctx.fillStyle = '#8c7ad9'
  ctx.font = '600 26px Arial, sans-serif'
  ctx.fillText('MY RETIREMENT ISLAND', x, 210)
  ctx.fillStyle = '#292431'
  ctx.font = '700 72px Arial, sans-serif'
  ctx.fillText(firstName, x, 300)

  // "Level 11" pill
  ctx.font = '700 34px Arial, sans-serif'
  const label = `Level ${level}`
  const pillWidth = ctx.measureText(label).width + 48
  ctx.fillStyle = '#33256c'
  ctx.beginPath()
  ctx.roundRect(x, 340, pillWidth, 64, 32)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.fillText(label, x + 24, 384)

  ctx.fillStyle = '#706b7b'
  ctx.font = '400 28px Arial, sans-serif'
  ctx.fillText('Start saving for your pension', x, 480)
  ctx.fillStyle = '#33256c'
  ctx.font = '700 34px Arial, sans-serif'
  ctx.fillText('LifeGrowth', x, 560)

  return new Promise((resolve) => card.toBlob(resolve, 'image/png'))
}

export function ShareIsland({ firstName, level }: { firstName: string; level: number }) {
  const [pending, startTransition] = useTransition()
  const [link, setLink] = useState<string>()
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string>()

  function share() {
    setError(undefined)
    startTransition(async () => {
      try {
        const formData = new FormData()
        const scene = document.querySelector<HTMLCanvasElement>('[data-share-scene] canvas')
        // The scene only draws while on screen: give it two frames, so the picture isn't empty.
        await nextFrame()
        await nextFrame()
        const picture = scene ? await previewPicture(scene, firstName, level) : null
        if (picture) formData.append('image', new File([picture], 'island.png', { type: 'image/png' }))

        const { path } = await createShareLink(formData)
        const url = `${window.location.origin}${path}`
        setLink(url)

        // Phones: the system share sheet (WhatsApp, LinkedIn… are in it).
        const isPhone = window.matchMedia('(pointer: coarse)').matches
        if (isPhone && navigator.share) {
          await navigator.share({ title: `${firstName}'s retirement island`, text: SHARE_TEXT, url }).catch(() => {})
        }
      } catch {
        setError("We couldn't create the link. Please try again.")
      }
    })
  }

  async function copy() {
    if (!link) return
    await navigator.clipboard.writeText(link)
    setCopied(true)
  }

  const shareTargets = link
    ? [
        { label: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(`${SHARE_TEXT} ${link}`)}` },
        { label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}` },
      ]
    : []

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={share}
        disabled={pending}
        className="pulse-hover flex w-full items-center justify-center gap-2 rounded-xl bg-[#f1effa] py-3 text-sm font-semibold text-[#5f4bb6] disabled:opacity-60 dark:bg-[#2b253a] dark:text-[#a594f0]"
      >
        <Share2 size={16} /> {pending ? 'Making your link…' : 'Share my island'}
      </button>
      {error && <p className="text-center text-xs text-[#b42318] dark:text-[#f3a4a4]">{error}</p>}
      {link && (
        <div className="grid grid-cols-3 gap-2">
          {shareTargets.map((target) => (
            <a
              key={target.label}
              href={target.href}
              target="_blank"
              rel="noreferrer"
              className="pulse-hover rounded-xl bg-white py-2.5 text-center text-xs font-semibold text-[#33256c] shadow-sm dark:bg-[#211d2b] dark:text-white"
            >
              {target.label}
            </a>
          ))}
          <button
            onClick={copy}
            className="pulse-hover flex items-center justify-center gap-1 rounded-xl bg-white py-2.5 text-xs font-semibold text-[#33256c] shadow-sm dark:bg-[#211d2b] dark:text-white"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>
      )}
    </div>
  )
}
