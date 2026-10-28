// Landing page: the question, one line, Sign up / Log in and the island. Everything else waits behind
// "Find out more", so the first contact stays clean.
import Link from 'next/link'
import { CreditCard, Landmark, ShieldCheck, Sparkles } from 'lucide-react'
import { Card, Logo } from '@/components/app/shell'
import { FindOutMore } from '@/components/landing/find-out-more'
import { HeroScene } from '@/components/landing/hero-scene'

// Every number has its source next to it (same constants as lib/rules/config.ts).
const FACTS = [
  { value: '~48%', text: 'of your net salary is what the state pension replaces for an average earner.', source: 'CNPP · OECD Pensions at a Glance', href: 'https://www.oecd.org/en/topics/pensions.html' },
  { value: '400 €', text: 'a year of Pillar III contributions is tax-deductible.', source: 'Legea nr. 204/2006', href: 'https://asfromania.ro' },
]

const EYEBROW = 'mb-1 text-xs font-medium uppercase tracking-[.18em] text-[#8c7ad9]'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#f7f6f9] text-[#292431] dark:bg-[#18151f] dark:text-[#f8f6fb]">
      <div className="mx-auto w-full max-w-[960px] px-5 pb-16 pt-6">
        <nav>
          <Logo />
        </nav>

        {/* Hero */}
        <section className="grid items-center gap-8 pt-8 md:grid-cols-2 md:pt-14">
          <div className="flex flex-col gap-5">
            <h1 className="text-[38px] font-semibold leading-[1.05] tracking-[-.04em] md:text-[48px]">
              Want to find out how you&rsquo;ll live in retirement?
            </h1>
            <p className="text-base leading-7 text-[#706b7b] dark:text-[#aaa4b6]">
              Upload your pension statement, answer 3 questions, and see your retirement in a minute. Then grow it with your
              card&rsquo;s round-ups.
            </p>
            <div className="flex max-w-[360px] flex-col gap-3">
              <Link href="/register" className="pulse-hover w-full rounded-xl bg-[#33256c] py-3 text-center text-sm font-semibold text-white dark:bg-[#6f5cc1]">
                Sign up
              </Link>
              <Link href="/login" className="pulse-hover w-full rounded-xl bg-white py-3 text-center text-sm font-semibold text-[#33256c] dark:bg-[#211d2b] dark:text-white">
                Log in
              </Link>
            </div>
          </div>
          <Card className="overflow-hidden p-0">
            <HeroScene />
          </Card>
        </section>

        <FindOutMore>
          <section className="pt-14">
            <p className={EYEBROW}>How it works</p>
            <h2 className="text-[27px] font-semibold tracking-[-.04em]">Small amounts, a better retirement</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <Card>
                <div className="flex size-10 items-center justify-center rounded-xl bg-[#f1effa] text-[#6f5cc1] dark:bg-[#2b253a]">
                  <CreditCard size={19} />
                </div>
                <p className="mt-4 font-semibold">Round up as you spend</p>
                <p className="mt-1 text-sm leading-6 text-[#706b7b] dark:text-[#aaa4b6]">
                  Coffee for 12.30 RON? We count 2.70 RON for your retirement. Nothing moves yet.
                </p>
              </Card>
              {FACTS.map((fact) => (
                <Card key={fact.value}>
                  <p className="text-[34px] font-semibold tracking-[-.04em] text-[#33256c] dark:text-[#a594f0]">{fact.value}</p>
                  <p className="mt-1 text-sm leading-6">{fact.text}</p>
                  <a href={fact.href} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-full bg-[#f1effa] px-2.5 py-1 text-xs font-medium text-[#6b57bd] dark:bg-[#2b253a] dark:text-[#a594f0]">
                    Source: {fact.source}
                  </a>
                </Card>
              ))}
            </div>
          </section>

          {/* Trust and business model */}
          <section className="pt-10">
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
                    Each month&rsquo;s amount stays with our licensed banking partner for one month before it reaches your Pillar III.
                    The interest from that month is how zile. stays free.{' '}
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
        </FindOutMore>
      </div>
    </main>
  )
}
