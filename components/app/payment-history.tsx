'use client'

// Month tab: the card payments the bank sent us (or a bank statement added), grouped by
// month, each with its round-up. Months before the user joined show what round-ups would
// have saved: the "if only I'd started earlier" moment of the demo.
import { ChevronRight, Landmark } from 'lucide-react'
import { formatRon } from '@/lib/rules/lifestyle'
import type { CardPayment } from '@/lib/data/app-data'
import { Card } from '@/components/app/shell'
import { monthName, shortDate } from '@/components/app/types'

export function PaymentHistory({ payments, openMonth, connectBank }: { payments: CardPayment[]; openMonth: string | null; connectBank: () => void }) {
  if (payments.length === 0) {
    return (
      <Card className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f1effa] text-[#6f5cc1] dark:bg-[#2b253a]">
          <Landmark size={18} />
        </span>
        <p className="flex-1 text-sm text-[#706b7b] dark:text-[#aaa4b6]">Connect your bank to see your card payments and round-ups.</p>
        <button onClick={connectBank} className="pulse-hover rounded-xl bg-[#f1effa] px-3 py-2 text-xs font-semibold text-[#5f4bb6] dark:bg-[#2b253a] dark:text-[#a594f0]">
          Connect
        </button>
      </Card>
    )
  }

  const months = [...new Set(payments.map((payment) => payment.month))]
  const missedBani = payments.filter((p) => p.beforeJoining).reduce((sum, p) => sum + p.roundupBani, 0)

  return (
    <Card>
      <p className="text-xs font-medium uppercase tracking-[.18em] text-[#8c7ad9]">Card payments</p>
      {missedBani > 0 && (
        <p className="mt-3 rounded-xl bg-[#fff6e5] px-3.5 py-2.5 text-sm leading-6 text-[#8a5a00] dark:bg-[#3a2f1a] dark:text-[#f3d08a]">
          With LifeGrowth in the months before you joined, round-ups would have saved you <b>{formatRon(missedBani)}</b>.
        </p>
      )}
      {months.map((month) => {
        const rows = payments.filter((payment) => payment.month === month)
        const total = rows.reduce((sum, row) => sum + row.roundupBani, 0)
        const label = month === openMonth ? 'counts for this month' : rows[0].beforeJoining ? 'before LifeGrowth' : 'already counted'
        // The open month is open by default; older months fold away to keep the list short.
        return (
          <details key={month} open={month === openMonth || months[0] === month} className="group mt-4">
            <summary className="flex cursor-pointer list-none items-baseline justify-between border-b border-[#e2dfe8] pb-1.5 dark:border-[#353042] [&::-webkit-details-marker]:hidden">
              <p className="text-sm font-semibold">
                <ChevronRight size={14} className="mr-1 inline transition-transform group-open:rotate-90" />
                {monthName(month)} <span className="text-xs font-normal text-[#858090] dark:text-[#a39cab]">· {label}</span>
              </p>
              <span className="text-xs font-semibold text-[#438565] dark:text-[#6bc495]">+{formatRon(total)}</span>
            </summary>
            <ul className="divide-y divide-dashed divide-[#e2dfe8] dark:divide-[#353042]">
              {rows.map((payment) => (
                <li key={payment.id} className="flex items-center justify-between py-2.5 text-sm animate-in fade-in slide-in-from-top-2 duration-500">
                  <div>
                    <p className="font-medium">{payment.counterparty}</p>
                    <p className="text-xs text-[#858090] dark:text-[#a39cab]">
                      {shortDate(payment.date)} · {formatRon(payment.spentBani)}
                    </p>
                  </div>
                  <span className={`font-semibold ${payment.beforeJoining ? 'text-[#96909f]' : 'text-[#438565] dark:text-[#6bc495]'}`}>
                    +{formatRon(payment.roundupBani)}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )
      })}
    </Card>
  )
}
