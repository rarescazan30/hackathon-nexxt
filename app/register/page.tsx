import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthLayout } from '@/components/auth/auth-layout'
import { RegisterOrSignedIn } from '@/components/auth/session-buttons'

export const metadata: Metadata = {
  title: 'LifeGrowth — Create account',
}

export default function RegisterPage() {
  return (
    <AuthLayout
      eyebrow="First step"
      title="Create account"
      subtitle="It takes a minute. Then we show you how you'd live in retirement."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-[#5f4bb6] dark:text-[#a594f0]">
            Log in
          </Link>
        </>
      }
    >
      {/* A neutral placeholder: neither the form nor the logged-in message flashes. */}
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-[#f1effa]/60 dark:bg-[#2b253a]/60" />}>
        <RegisterOrSignedIn />
      </Suspense>
    </AuthLayout>
  )
}
