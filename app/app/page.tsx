import type { Metadata } from 'next'
import { AppShell } from '@/components/app/app-shell'

export const metadata: Metadata = {
  title: 'zile. — Home',
}

// Logged-in users only: proxy.ts sends everyone else to /login.
export default function AppPage() {
  return <AppShell />
}
