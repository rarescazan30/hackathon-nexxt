'use client'

// Profile tab: round-up and salary-share settings, your details and pensions (editable),
// terms, and log out.
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { FileText, LogOut } from 'lucide-react'
import { formatRon } from '@/lib/rules/lifestyle'
import type { AppData } from '@/lib/data/app-data'
import { updateSettings } from '@/app/app/actions'
import { AdminButton, Card, Header } from '@/components/app/shell'
import { DetailsEditor } from '@/components/app/details-editor'
import { SECONDARY_BUTTON } from '@/components/onboarding/onboarding-state'
import { shortDate } from '@/components/app/types'

const ROUNDUP_OPTIONS = [
  { bani: 0, label: 'Off' },
  { bani: 100, label: '1 RON' },
  { bani: 500, label: '5 RON' },
  { bani: 1000, label: '10 RON' },
]
const SALARY_OPTIONS = [0, 100, 300, 500] // basis points: 0%, 1%, 3%, 5%

const PENSION_NAMES: Record<string, string> = { pillar2: 'Pillar II', pillar3: 'Pillar III' }

function Choice({ selected, disabled, onClick, children }: { selected: boolean; disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`pulse-hover rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
        selected ? 'bg-[#33256c] text-white' : 'bg-[#f1effa] text-[#706b7b] dark:bg-[#2b253a] dark:text-[#aaa4b6]'
      }`}
    >
      {children}
    </button>
  )
}

export function ProfileScreen({ data }: { data: AppData }) {
  const [pending, startTransition] = useTransition()
  const { settings } = data
  const save = (change: Partial<{ roundupRuleBani: number; salaryPercentBp: number }>) =>
    startTransition(() =>
      updateSettings({
        roundupRuleBani: (change.roundupRuleBani ?? settings.roundupRuleBani) as 0 | 100 | 500 | 1000,
        salaryPercentBp: change.salaryPercentBp ?? settings.salaryPercentBp,
      }),
    )

  const [editing, setEditing] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      {editing && <DetailsEditor data={data} onClose={() => setEditing(false)} />}
      <Header title={data.user.fullName} subtitle="Your profile" action={data.user.isAdmin && <AdminButton />} />

      <Card>
        <p className="mb-4 flex items-center gap-1.5 text-xs font-medium uppercase tracking-[.18em] text-[#8c7ad9]">
          Your piggy bank · goes to your Pillar III
        </p>
        <p className="text-sm font-semibold">Round up each card payment to</p>
        <p className="mb-3 text-xs text-[#858090] dark:text-[#a39cab]">Coffee 12.30 RON → 15.00 RON with 5 RON: +2.70 RON saved</p>
        <div className="grid grid-cols-4 gap-2">
          {ROUNDUP_OPTIONS.map((option) => (
            <Choice key={option.bani} selected={settings.roundupRuleBani === option.bani} disabled={pending} onClick={() => save({ roundupRuleBani: option.bani })}>
              {option.label}
            </Choice>
          ))}
        </div>

        <p className="mt-5 text-sm font-semibold">Share of your salary each month</p>
        <p className="mb-3 text-xs text-[#858090] dark:text-[#a39cab]">Of {formatRon(settings.netSalaryBani, { wholeRon: true })} net</p>
        <div className="grid grid-cols-4 gap-2">
          {SALARY_OPTIONS.map((bp) => (
            <Choice key={bp} selected={settings.salaryPercentBp === bp} disabled={pending} onClick={() => save({ salaryPercentBp: bp })}>
              {bp / 100}%
            </Choice>
          ))}
        </div>
      </Card>

      <Card>
        <p className="mb-3 text-xs font-medium uppercase tracking-[.18em] text-[#8c7ad9]">Your details</p>
        <ul className="space-y-3 text-sm">
          <li className="flex justify-between">
            <span>Net salary</span>
            <b>{formatRon(settings.netSalaryBani, { wholeRon: true })}/mo</b>
          </li>
          <li className="flex justify-between">
            <span>Born in</span>
            <b>{settings.birthYear ?? '—'}</b>
          </li>
          <li className="flex justify-between">
            <span>Years worked</span>
            <b>{settings.yearsWorked ?? '—'}</b>
          </li>
        </ul>

        <p className="mb-3 mt-6 text-xs font-medium uppercase tracking-[.18em] text-[#8c7ad9]">Your pensions</p>
        <ul className="space-y-3 text-sm">
          <li className="flex justify-between">
            <span>State pension (estimate)</span>
            <b>{formatRon(data.retirement.statePensionBani, { wholeRon: true })}/mo</b>
          </li>
          {data.pensions.map((pension) => (
            <li key={pension.id} className="flex justify-between">
              <span>
                {PENSION_NAMES[pension.type] ?? pension.type}
                {pension.provider ? ` · ${pension.provider}` : ''}
                <span className="block text-xs text-[#858090] dark:text-[#a39cab]">on {shortDate(pension.asOf)}</span>
              </span>
              <b>{formatRon(pension.balanceBani, { wholeRon: true })}</b>
            </li>
          ))}
          <li className="flex justify-between">
            <span>Pillar III through zile.</span>
            <b>{formatRon(data.contributedBani, { wholeRon: true })}</b>
          </li>
        </ul>

        {data.statementIsOld && (
          <p className="mt-4 rounded-xl bg-[#fff6e5] px-3.5 py-2.5 text-xs leading-5 text-[#8a5a00] dark:bg-[#3a2f1a] dark:text-[#f3d08a]">
            Your newest statement is more than a year old. Funds send a new one every year: upload it to keep your numbers right.
          </p>
        )}
        <button onClick={() => setEditing(true)} className={`${SECONDARY_BUTTON} mt-4`}>
          Update your details
        </button>
      </Card>

      <Card className="flex flex-col gap-1 p-2">
        <Link href="/terms" className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium hover:bg-[#f1effa] dark:hover:bg-[#2b253a]">
          <FileText size={17} className="text-[#8c7ad9]" /> Terms and how we make money
        </Link>
        <form action="/auth/signout" method="post">
          <button className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-[#b42318] hover:bg-[#fdecec] dark:text-[#f3a4a4] dark:hover:bg-[#3a1f24]">
            <LogOut size={17} /> Log out
          </button>
        </form>
      </Card>
    </div>
  )
}
