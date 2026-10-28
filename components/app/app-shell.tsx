'use client'

// The logged-in app (route /app): three tabs and the level-up moment.
import { useState } from 'react'
import type { AppData } from '@/lib/data/app-data'
import { BottomNav } from '@/components/app/shell'
import { type Tab } from '@/components/app/types'
import { HomeScreen } from '@/components/app/home-screen'
import { MonthScreen } from '@/components/app/month-screen'
import { ProfileScreen } from '@/components/app/profile-screen'
import { LevelUpOverlay } from '@/components/app/level-up-overlay'

export function AppShell({ data }: { data: AppData }) {
  const [tab, setTabState] = useState<Tab>('home')
  const setTab = (next: Tab) => {
    setTabState(next)
    window.scrollTo({ top: 0 })
  }
  const screens = {
    home: <HomeScreen data={data} setTab={setTab} />,
    month: <MonthScreen data={data} setTab={setTab} />,
    profile: <ProfileScreen data={data} />,
  }

  return (
    <main className="min-h-screen bg-[#f7f6f9] text-[#292431] dark:bg-[#18151f] dark:text-[#f8f6fb]">
      <div className="mx-auto min-h-screen w-full max-w-[430px] px-5 pb-28 pt-6">{screens[tab]}</div>
      <BottomNav tab={tab} setTab={setTab} />
      {data.levelUp && (
        <LevelUpOverlay
          key={data.levelUp.level}
          level={data.levelUp.level}
          slot={data.levelUp.slot}
          slots={data.level.slots}
          isMilestone={data.level.isMilestone}
        />
      )}
    </main>
  )
}
