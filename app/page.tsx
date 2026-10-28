// Landing page: the hook, how it works, why it matters in Romania, and how we make money.
import Link from 'next/link'
import { CalendarCheck, CreditCard, Landmark, ShieldCheck, Sparkles } from 'lucide-react'
import { Card, Logo } from '@/components/app/shell'
import { DemoButton } from '@/components/auth/demo-button'
import { HeroScene } from '@/components/landing/hero-scene'

const STEPS = [
  { icon: CreditCard, title: 'Round up as you spend', text: 'Coffee for 12.30 RON? We count 2.70 RON for your retirement. Nothing moves yet.' },
  { icon: CalendarCheck, title: 'One tap a month', text: '“Add 229 RON to your Pillar III?” Yes, another amount, or skip. You decide.' },
  { icon: Sparkles, title: 'Watch your retirement grow', text: 'Every contribution adds days of freedom and XP. Level up from a tent to a villa.' },
]

// Every number has its source next to it (same constants as lib/rules/config.ts).
const FACTS = [
  { value: '~48%', text: 'of your net salary is what the state pension replaces for an average earner.', source: 'CNPP · OECD Pensions at a Glance', href: 'https://www.oecd.org/en/topics/pensions.html' },
  { value: '400 €', text: 'a year of Pillar III contributions is tax-deductible.', source: 'Legea nr. 204/2006', href: 'https://asfromania.ro' },
  { value: '65', text: 'is the standard retirement age, so at 35 you still have 30 years to change the picture.', source: 'Legea nr. 360/2023', href: 'https://legislatie.just.ro' },
]

const PRIMARY = 'w-full rounded-xl bg-[#33256c] py-3 text-center text-sm font-semibold text-white'
const SECONDARY = 'w-full rounded-xl bg-white py-3 text-center text-sm font-semibold text-[#33256c] dark:bg-[#211d2b] dark:text-white'
const EYEBROW = 'mb-1 text-[11px] font-medium uppercase tracking-[.18em] text-[#8c7ad9]'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#f7f6f9] text-[#292431] dark:bg-[#18151f] dark:text-[#f8f6fb]">
      <div className="mx-auto w-full max-w-[960px] px-5 pb-16 pt-6">
        <nav className="flex items-center justify-between">
          <Logo />
          <Link href="/login" className="text-sm font-semibold text-[#5f4bb6] dark:text-[#a594f0]">
            Log in
          </Link>
        </nav>

        {/* Hero */}
        <section className="grid items-center gap-8 pt-10 md:grid-cols-2 md:pt-16">
          <div className="flex flex-col gap-5">
            <p className={EYEBROW}>For people in their 30s</p>
            <h1 className="text-[38px] font-semibold leading-[1.05] tracking-[-.04em] md:text-[48px]">
              Want to find out how you&rsquo;ll live in retirement?
            </h1>
            <p className="text-base leading-7 text-[#706b7b] dark:text-[#aaa4b6]">
              Upload your pension statement and answer three questions. In a minute you see your retirement as a little world, then
              grow it with round-ups from your card, added to your Pillar III once a month.
            </p>
            <div className="flex max-w-[360px] flex-col gap-3">
              <Link href="/register" className={PRIMARY}>
                Find out in 1 minute
              </Link>
              <DemoButton />
            </div>
          </div>
          <Card className="overflow-hidden p-0">
            <HeroScene />
          </Card>
        </section>

        {/* How it works */}
        <section className="pt-16">
          <p className={EYEBROW}>How it works</p>
          <h2 className="text-[27px] font-semibold tracking-[-.04em]">Small steps, one tap a month</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, text }) => (
              <Card key={title}>
                <div className="flex size-10 items-center justify-center rounded-xl bg-[#f1effa] text-[#6f5cc1] dark:bg-[#2b253a]">
                  <Icon size={19} />
                </div>
                <p className="mt-4 font-semibold">{title}</p>
                <p className="mt-1 text-sm leading-6 text-[#706b7b] dark:text-[#aaa4b6]">{text}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Why Romania */}
        <section className="pt-16">
          <p className={EYEBROW}>Why it matters in Romania</p>
          <h2 className="text-[27px] font-semibold tracking-[-.04em]">The state pension won&rsquo;t pay for the life you have now</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {FACTS.map((fact) => (
              <Card key={fact.value}>
                <p className="text-[34px] font-semibold tracking-[-.04em] text-[#33256c] dark:text-[#a594f0]">{fact.value}</p>
                <p className="mt-1 text-sm leading-6">{fact.text}</p>
                <a href={fact.href} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-full bg-[#f1effa] px-2.5 py-1 text-[11px] font-medium text-[#6b57bd] dark:bg-[#2b253a] dark:text-[#a594f0]">
                  Source: {fact.source}
                </a>
              </Card>
            ))}
          </div>
        </section>

        {/* Trust and business model */}
        <section className="pt-16">
          <Card className="grid gap-6 md:grid-cols-2">
            <div>
              <p className={EYEBROW}>Safe and open</p>
              <h2 className="text-[24px] font-semibold tracking-[-.03em]">Your money, your pension, our model in plain sight</h2>
            </div>
            <ul className="flex flex-col gap-4 text-sm leading-6">
              <li className="flex gap-3">
                <Landmark size={18} className="mt-1 shrink-0 text-[#6f5cc1]" />
                <span>Your money goes to a Pillar III fund regulated by ASF, in your name.</span>
              </li>
              <li className="flex gap-3">
                <ShieldCheck size={18} className="mt-1 shrink-0 text-[#6f5cc1]" />
                <span>
                  Each month&rsquo;s amount stays with our licensed banking partner for one month before it reaches your Pillar III. The
                  interest from that month is how zile. stays free.{' '}
                  <Link href="/terms" className="font-semibold text-[#5f4bb6] underline dark:text-[#a594f0]">
                    Read the terms
                  </Link>
                </span>
              </li>
              <li className="flex gap-3">
                <Sparkles size={18} className="mt-1 shrink-0 text-[#6f5cc1]" />
                <span>We show scenarios and education, not investment advice. You confirm every month.</span>
              </li>
            </ul>
          </Card>
        </section>

        {/* Final call to action */}
        <section className="flex flex-col items-center gap-4 pt-16 text-center">
          <h2 className="text-[27px] font-semibold tracking-[-.04em]">See your retirement in one minute</h2>
          <div className="flex w-full max-w-[360px] flex-col gap-3">
            <Link href="/register" className={PRIMARY}>
              Get started
            </Link>
            <Link href="/login" className={SECONDARY}>
              I already have an account
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
