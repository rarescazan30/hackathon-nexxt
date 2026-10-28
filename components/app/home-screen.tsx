'use client'

// Home tab: days of freedom (the hook), the 3D retirement scene with the level bar and
// the share button, and a small card for this month's counter.
import { ArrowRight, Sparkles } from 'lucide-react'
import { formatFreedom, formatRatio, formatRon } from '@/lib/rules/lifestyle'
import type { AppData } from '@/lib/data/app-data'
import { AdminButton, Card, Header } from '@/components/app/shell'
import { CountUpFreedom } from '@/components/app/count-up-freedom'
import { ShareIsland } from '@/components/app/share-island'
import { type Tab } from '@/components/app/types'
import { LifestyleScene, slotLabel } from '@/components/scene'

export function HomeScreen({ data, setTab }: { data: AppData; setTab: (tab: Tab) => void }) {
  const { level, freedom, currentJar, retirement } = data
  const progress = level.xpForNext ? Math.min(100, Math.round((level.xpIntoLevel / level.xpForNext) * 100)) : 100

  return (
    <div className="flex flex-col gap-4">
      <Header title={`Hi, ${data.user.firstName}`} subtitle="Your retirement, today" action={data.user.isAdmin && <AdminButton />} />

      <Card className="!bg-[#33256c] text-white dark:!bg-[#2a2147]">
        <p className="text-xs font-medium uppercase tracking-[.18em] text-[#c9bff0]">Days of freedom</p>
        <p className="mt-2 text-[34px] font-semibold leading-tight tracking-[-.04em]">
          <CountUpFreedom days={freedom.totalDays} />
        </p>
        <p className="mt-1 text-sm text-[#d9d2f5]">of retirement your savings will pay for at 65, in today&rsquo;s money</p>
        {freedom.daysFromApp > 0 && (
          <span className="mt-4 inline-flex rounded-full bg-[#bfe8d1] px-3 py-1 text-xs font-semibold text-[#236243]">
            +{formatFreedom(freedom.daysFromApp)} since using our app
          </span>
        )}
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="px-5 pt-5">
          <span className="inline-flex whitespace-nowrap rounded-full bg-[#f1effa] px-3 py-1 text-xs font-semibold text-[#5f4bb6] dark:bg-[#2b253a] dark:text-[#a594f0]">
            Level {level.level}
          </span>
          <p className="mt-3 text-xs font-medium uppercase tracking-[.18em] text-[#8c7ad9]">If you retired today</p>
          <p className="mt-1 text-sm text-[#706b7b] dark:text-[#aaa4b6]">
            about <b className="text-[#292431] dark:text-white">{formatRatio(retirement.replacementRatio)}</b> of the life you have now
          </p>
        </div>
        <div data-share-scene>
          <LifestyleScene slots={level.slots} snapshot />
        </div>
        <div className="px-5 pb-5">
          <div className="h-2 overflow-hidden rounded-full bg-[#e8e3f7] dark:bg-[#2b253a]">
            <div className="h-full rounded-full bg-[#6f5cc1] transition-all duration-700" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-xs text-[#858090] dark:text-[#a39cab]">
            <span>{level.xpForNext ? `${level.xpIntoLevel} / ${level.xpForNext} XP` : 'Top level reached'}</span>
            {level.next && (
              <span className="flex items-center gap-1 font-medium text-[#5f4bb6] dark:text-[#a594f0]">
                <Sparkles size={12} /> Next: {slotLabel(level.next.slot, level.next.tier).toLowerCase()}
              </span>
            )}
          </div>
          <div className="mt-4">
            <ShareIsland firstName={data.user.firstName} level={level.level} />
          </div>
        </div>
      </Card>

      {currentJar && (
        <button onClick={() => setTab('month')} className="text-left">
          <Card className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[.18em] text-[#8c7ad9]">
                {currentJar.status === 'offered' ? 'Ready to add' : 'This month'}
              </p>
              <p className="mt-1 text-xl font-semibold tracking-[-.02em]">{formatRon(currentJar.totalBani)}</p>
              <p className="text-xs text-[#858090] dark:text-[#a39cab]">
                {currentJar.status === 'offered' ? 'Your monthly offer is waiting' : 'saved so far from round-ups and salary'}
              </p>
            </div>
            <ArrowRight size={18} className="text-[#8c7ad9]" />
          </Card>
        </button>
      )}
    </div>
  )
}
