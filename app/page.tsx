'use client'

import { useState } from 'react'
import { BottomNav } from '@/components/app/shell'
import { type Tab } from '@/components/app/types'
import { HomeScreen } from '@/components/app/home-screen'
import { AgentScreen } from '@/components/app/agent-screen'
import { ProgressScreen } from '@/components/app/progress-screen'
import { ProfileScreen } from '@/components/app/profile-screen'

// Single-page prototype: the bottom nav switches between the four tabs.
export default function Page() { const [tab, setTab] = useState<Tab>('home'); const screens = { home: <HomeScreen setTab={setTab} />, agent: <AgentScreen />, progress: <ProgressScreen />, profile: <ProfileScreen /> }; return <main className="min-h-screen bg-[#f7f6f9] text-[#292431] dark:bg-[#18151f] dark:text-[#f8f6fb]"><div className="mx-auto min-h-screen w-full max-w-[430px] px-5 pb-28 pt-6">{screens[tab]}</div><BottomNav tab={tab} setTab={setTab} /></main> }
