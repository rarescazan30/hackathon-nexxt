// /terms: the short, plain-English terms, including how LifeGrowth makes money.
// A hackathon draft, not legal text.
import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, Logo } from '@/components/app/shell'

export const metadata: Metadata = {
  title: 'LifeGrowth — Terms',
}

const SECTIONS = [
  {
    title: 'What LifeGrowth does',
    body: 'LifeGrowth rounds up your card payments and adds an optional share of your salary into a monthly counter. At the end of each month we suggest an amount to add to your Pillar III (voluntary) pension. Nothing leaves your account until you say yes.',
  },
  {
    title: 'How the money moves',
    body: 'When you say yes, that amount is collected from your bank account or from the card you saved (processed by Stripe; we never see or store your card number). It stays with our licensed banking partner for one month. On the 1st of the following month it is sent to your Pillar III fund, which buys fund units in your name.',
  },
  {
    title: 'How we make money',
    body: 'While your monthly amount is held for that one month, it earns interest. LifeGrowth and its banking partner keep that interest. This is what keeps the app free. You never pay a fee to LifeGrowth, and the full amount you confirmed reaches your Pillar III.',
  },
  {
    title: 'The one-month delay',
    body: 'Because of the hold, your money reaches your pension one month later than if you paid the fund directly. For a monthly contribution this costs very little in growth, but we want you to know it.',
  },
  {
    title: 'Education, not advice',
    body: 'Days of freedom, levels and the retirement scene are estimates in today’s money, based on cautious assumptions. They are not a promise and not investment advice. Pillar III funds are regulated by ASF; their value can go down as well as up.',
  },
  {
    title: 'Your data',
    body: 'We use your pension statements and card payments only to calculate your numbers. Statements are stored in a private folder only you can access. You can delete your account at any time.',
  },
]

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f7f6f9] text-[#292431] dark:bg-[#18151f] dark:text-[#f8f6fb]">
      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-4 px-5 pb-16 pt-6">
        <Link href="/" aria-label="Home" className="self-start">
          <Logo />
        </Link>
        <header className="px-1 pb-2 pt-6">
          <p className="mb-1 text-xs font-medium uppercase tracking-[.18em] text-[#8c7ad9]">Terms</p>
          <h1 className="text-[27px] font-semibold tracking-[-.04em]">Plain-English terms</h1>
          <p className="mt-2 text-sm text-[#706b7b] dark:text-[#aaa4b6]">Hackathon draft. The short version of how LifeGrowth works and how it makes money.</p>
        </header>
        {SECTIONS.map((section) => (
          <Card key={section.title}>
            <h2 className="font-semibold">{section.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#706b7b] dark:text-[#aaa4b6]">{section.body}</p>
          </Card>
        ))}
      </div>
    </main>
  )
}
