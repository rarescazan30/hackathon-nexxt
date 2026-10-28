// Temporary home page until the landing page lands (plan step 6).
import Link from 'next/link'
import { Logo } from '@/components/app/shell'
import { DemoButton } from '@/components/auth/demo-button'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f7f6f9] text-[#292431] dark:bg-[#18151f] dark:text-[#f8f6fb]">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col justify-center gap-8 px-5 py-10">
        <Logo />
        <div>
          <p className="mb-1 text-[11px] font-medium uppercase tracking-[.18em] text-[#8c7ad9]">Your retirement, today</p>
          <h1 className="text-[34px] font-semibold leading-tight tracking-[-.04em]">
            Want to find out how you&rsquo;ll live in retirement?
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#706b7b] dark:text-[#aaa4b6]">
            We round up your card payments and, once a month, add them to your Pillar III pension. Watch your retirement life get better.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Link href="/register" className="w-full rounded-xl bg-[#33256c] py-3 text-center text-sm font-semibold text-white">
            Find out in 1 minute
          </Link>
          <Link href="/login" className="w-full rounded-xl bg-white py-3 text-center text-sm font-semibold text-[#33256c] dark:bg-[#211d2b] dark:text-white">
            I already have an account
          </Link>
          <DemoButton />
        </div>
      </div>
    </main>
  )
}
