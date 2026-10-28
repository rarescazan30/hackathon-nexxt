'use client'

import { useEffect, useSyncExternalStore, useState } from 'react'
import {
  Banknote,
  Bot,
  CheckCircle2,
  Coffee,
  Info,
  PiggyBank,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react'
import type { RiskLevel } from '@/lib/contracts'
import { monthlyHistory as initialHistory, user } from '@/data/mock/ui'
import { Card, Header } from '@/components/app/shell'
import { type Tab } from '@/components/app/types'

export interface SimulatedPayment {
  id: string
  label: string
  detail: string
  spentBani: number
  icon: 'coffee' | 'cart'
}

export interface AppState {
  name: string
  fullName: string
  age: number
  city: string
  salaryBani: number
  risk: RiskLevel
  roundUpStepLei: 0 | 1 | 5 | 10
  roundUpMultiplier: 1 | 2 | 3
  salaryPercent: 0 | 1 | 3 | 5 | 10
  extraContributionLei: number
  excludedMonths: string[]
  suggestionStatus: 'pending' | 'accepted' | 'dismissed'
  pendingAgentPrompt: string
  bankName: string
  bankConfirmedDaysAgo: number
  darkMode: boolean
  extraPayments: SimulatedPayment[]
}

const STORAGE_KEY = 'nexxt_app_state_v1'

const defaultState: AppState = {
  name: user.name,
  fullName: 'Andrei Popescu',
  age: user.age,
  city: 'București',
  salaryBani: user.salary * 100, // 450000 bani = 4.500 lei
  risk: user.risk,
  roundUpStepLei: 1,
  roundUpMultiplier: 1,
  salaryPercent: 3,
  extraContributionLei: 0,
  excludedMonths: [],
  suggestionStatus: 'pending',
  pendingAgentPrompt: '',
  bankName: 'Banca Transilvania',
  bankConfirmedDaysAgo: 12,
  darkMode: false,
  extraPayments: [],
}

let currentState: AppState = defaultState
const listeners = new Set<() => void>()

function emitChange() {
  for (const listener of listeners) {
    listener()
  }
}

export function updateAppState(updater: Partial<AppState> | ((prev: AppState) => AppState)) {
  const next = typeof updater === 'function' ? updater(currentState) : { ...currentState, ...updater }
  currentState = next
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Ignore storage quota errors in private browsing
    }
    document.documentElement.classList.toggle('dark', next.darkMode)
    document.documentElement.classList.toggle('light', !next.darkMode)
  }
  emitChange()
}

export function resetAppState() {
  updateAppState(defaultState)
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot(): AppState {
  return currentState
}

function getServerSnapshot(): AppState {
  return defaultState
}

let hydrated = false

export function useAppState(): AppState {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  useEffect(() => {
    if (!hydrated && typeof window !== 'undefined') {
      hydrated = true
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<AppState>
          currentState = { ...defaultState, ...parsed }
          document.documentElement.classList.toggle('dark', currentState.darkMode)
          document.documentElement.classList.toggle('light', !currentState.darkMode)
          emitChange()
        }
      } catch {
        // Ignore invalid stored JSON
      }
    }
  }, [])

  return state
}

// Pure integer bani round-up calculation for a single card payment
export function computeRoundUpBani(
  spentBani: number,
  stepLei: 0 | 1 | 5 | 10,
  multiplier: 1 | 2 | 3
): number {
  if (stepLei === 0) return 0
  const stepBani = stepLei * 100
  const remainder = spentBani % stepBani
  const rawRoundUp = remainder === 0 ? stepBani : stepBani - remainder
  return rawRoundUp * multiplier
}

export function formatLei(amountLei: number, decimals = 0): string {
  return `${amountLei.toLocaleString('ro-RO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} lei`
}

export function formatBaniAsLei(bani: number, forceDecimals = false): string {
  const isWhole = bani % 100 === 0 && !forceDecimals
  const lei = bani / 100
  return `${lei.toLocaleString('ro-RO', {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: isWhole ? 0 : 2,
  })} lei`
}

export function formatNumberRo(n: number): string {
  return Math.round(n).toLocaleString('ro-RO')
}

// Benchmark yields for Romanian financial instruments (RON, 2025-2026 official references)
export const ROMANIAN_INSTRUMENTS = [
  {
    name: 'Titluri de stat FIDELIS & TEZAUR (RON)',
    ratePct: 6.8,
    rangeText: '6,0% – 7,0%/an',
    taxNote: 'Neimpozabil (0% impozit)',
    source: 'Ministerul Finanțelor / BVB',
  },
  {
    name: 'Pilonul 3 Pensii Facultative',
    ratePct: 7.9,
    rangeText: '7,5% – 8,4%/an',
    taxNote: 'Deductibil în limita a 400 EUR/an',
    source: 'ASF / ANAF',
  },
  {
    name: 'Pilonul 2 Pensii Administrate Privat',
    ratePct: 8.1,
    rangeText: '7,8% – 8,5%/an',
    taxNote: 'Contribuție CAS 4,75% din brut',
    source: 'ASF România',
  },
  {
    name: 'ETF BET Patria-TradeVille / Acțiuni BVB',
    ratePct: 13.4,
    rangeText: '11,5% – 15,5%/an',
    taxNote: 'Indicele BET-TR (cu dividende)',
    source: 'Bursa de Valori București (BVB)',
  },
  {
    name: 'Depozite bancare la termen (RON)',
    ratePct: 5.4,
    rangeText: '5,0% – 5,8%/an',
    taxNote: 'Impozit pe dobândă 10%',
    source: 'BNR Statistică Monetară',
  },
] as const

export const RISK_CONFIG: Record<
  RiskLevel,
  {
    labelRo: string
    subtitleRo: string
    nominalReturnPct: number
    prudentReturnPct: number
    optimisticReturnPct: number
    inflationPct: number
    daysMultiplier: number
    bandSpread: number
    allocationSplit: { pillar3Pct: number; etfBetPct: number; govBondsPct: number }
    instrumentsSummaryRo: string
  }
> = {
  low: {
    labelRo: 'Scăzut',
    subtitleRo: 'Scăzut · Titluri de stat Fidelis/Tezaur (6,8%) & Pilonul 3',
    nominalReturnPct: 6.8,
    prudentReturnPct: 5.4,
    optimisticReturnPct: 7.8,
    inflationPct: 4.0,
    daysMultiplier: 0.9,
    bandSpread: 0.08,
    allocationSplit: { pillar3Pct: 35, etfBetPct: 5, govBondsPct: 60 },
    instrumentsSummaryRo: '60% Titluri Fidelis/Tezaur (6,8%) · 35% Pilonul 3 (7,9%) · 5% ETF BET',
  },
  medium: {
    labelRo: 'Mediu',
    subtitleRo: 'Mediu · Pilonul 3 (7,9%) + ETF BET BVB (13,4%) + Fidelis (6,8%)',
    nominalReturnPct: 9.2,
    prudentReturnPct: 6.5,
    optimisticReturnPct: 11.8,
    inflationPct: 4.0,
    daysMultiplier: 1.0,
    bandSpread: 0.11,
    allocationSplit: { pillar3Pct: 50, etfBetPct: 30, govBondsPct: 20 },
    instrumentsSummaryRo: '50% Pilonul 3 (7,9%) · 30% ETF BET BVB (13,4%) · 20% Fidelis (6,8%)',
  },
  high: {
    labelRo: 'Ridicat',
    subtitleRo: 'Ridicat · Acțiuni BVB / ETF BET (13,4%) + Pilonul 3 Dinamic',
    nominalReturnPct: 11.8,
    prudentReturnPct: 7.6,
    optimisticReturnPct: 15.2,
    inflationPct: 4.0,
    daysMultiplier: 1.18,
    bandSpread: 0.16,
    allocationSplit: { pillar3Pct: 25, etfBetPct: 65, govBondsPct: 10 },
    instrumentsSummaryRo: '65% ETF BET / Acțiuni BVB (13,4%) · 25% Pilonul 3 (7,9%) · 10% Fidelis',
  },
}

const MONTH_TRANSLATIONS: Record<string, string> = {
  'October 2026': 'Octombrie 2026',
  'September 2026': 'Septembrie 2026',
  'August 2026': 'August 2026',
  'July 2026': 'Iulie 2026',
  'June 2026': 'Iunie 2026',
  'May 2026': 'Mai 2026',
}

const DESTINATION_TRANSLATIONS: Record<string, string> = {
  'Pillar 3 + ETF BET': 'Pilonul 3 + ETF BET',
  'Pillar 3': 'Pilonul 3',
}

export function useDerivedFinancials() {
  const state = useAppState()
  const riskMeta = RISK_CONFIG[state.risk]

  // Round-up calculation in integer bani
  const stepFactor =
    state.roundUpStepLei === 0
      ? 0
      : state.roundUpStepLei === 1
        ? 1
        : state.roundUpStepLei === 5
          ? 2
          : 3

  const extraPaymentsRoundUpBani = state.extraPayments.reduce(
    (acc, item) =>
      acc + computeRoundUpBani(item.spentBani, state.roundUpStepLei, state.roundUpMultiplier),
    0
  )

  const baseRoundUpsBani = user.roundUps * 100 // 7400 bani = 74 lei
  const roundUpsBani =
    baseRoundUpsBani * stepFactor * state.roundUpMultiplier + extraPaymentsRoundUpBani

  // Salary percentage set-aside in integer bani
  const paydayBani = Math.round((state.salaryBani * state.salaryPercent) / 100)

  // AI suggestion bonus (+50 lei to Pillar 3 if accepted)
  const bonusPillar3Bani = state.suggestionStatus === 'accepted' ? 5000 : 0

  const currentMonthKey = initialHistory[0]?.month ?? 'October 2026'
  const isCurrentMonthExcluded = state.excludedMonths.includes(currentMonthKey)

  const rawSavedThisMonthBani = roundUpsBani + paydayBani + bonusPillar3Bani
  const moneySavedThisMonthBani = isCurrentMonthExcluded ? 0 : rawSavedThisMonthBani
  const moneySavedThisMonthLei = Math.round(moneySavedThisMonthBani / 100)

  // Total monthly contribution including the +0..+500 lei/lună slider
  const totalMonthlyContributionBani =
    moneySavedThisMonthBani + state.extraContributionLei * 100
  const totalMonthlyContributionLei = Math.round(totalMonthlyContributionBani / 100)

  // Days gained this month (baseline: 20900 bani -> 14 days at medium risk)
  const daysGainedThisMonth = isCurrentMonthExcluded
    ? 0
    : Math.max(
        0,
        Math.round((rawSavedThisMonthBani * 14 * riskMeta.daysMultiplier) / 20900)
      )

  const projectedMonthlyDaysWithSlider = Math.max(
    0,
    Math.round((totalMonthlyContributionBani * 14 * riskMeta.daysMultiplier) / 20900)
  )

  // Historical months with live current month & exclusion status
  const historyItems = initialHistory.map((item, idx) => {
    const excluded = state.excludedMonths.includes(item.month)
    const amountLei = idx === 0 ? Math.round(rawSavedThisMonthBani / 100) : item.amount
    const days =
      idx === 0
        ? Math.max(0, Math.round((rawSavedThisMonthBani * 14 * riskMeta.daysMultiplier) / 20900))
        : Math.round(item.days * riskMeta.daysMultiplier)
    return {
      id: item.month,
      monthRo: MONTH_TRANSLATIONS[item.month] ?? item.month,
      destinationRo: DESTINATION_TRANSLATIONS[item.destination] ?? item.destination,
      amountLei,
      days,
      excluded,
    }
  })

  // Subtract excluded historical days & add delta from current month adjustments
  const excludedDaysSum = historyItems
    .filter((h) => h.excluded)
    .reduce((sum, h) => sum + h.days, 0)

  const currentMonthDeltaDays = isCurrentMonthExcluded ? 0 : daysGainedThisMonth - 14
  const baseAcquiredDays = Math.round(user.days * riskMeta.daysMultiplier)
  const acquiredDays = Math.max(
    0,
    baseAcquiredDays - excludedDaysSum + currentMonthDeltaDays
  )

  const acquiredRange: readonly [number, number] = [
    Math.max(0, Math.round(acquiredDays * (1 - riskMeta.bandSpread))),
    Math.round(acquiredDays * (1 + riskMeta.bandSpread)),
  ]

  // Projection series from user's current age (e.g. 26) to 65 (13 points)
  const retirementAge = 65
  const totalYears = Math.max(6, retirementAge - state.age)
  const steps = 12
  const baseTargetAt65 = 4494 // 326 + 4494 = 4820 zile at baseline (209 lei/lună, medium risk)
  const baselineRealSpread = 9.2 - 4.0 // 5.2% real return reference

  const contributionRatio = totalMonthlyContributionBani / 20900
  const realBaseGrowth =
    (riskMeta.nominalReturnPct - riskMeta.inflationPct) / baselineRealSpread
  const realPrudentGrowth =
    (riskMeta.prudentReturnPct - riskMeta.inflationPct) / baselineRealSpread
  const realOptimisticGrowth =
    (riskMeta.optimisticReturnPct - riskMeta.inflationPct) / baselineRealSpread

  const projectionPoints = Array.from({ length: steps + 1 }, (_, i) => {
    const progress = i / steps // 0..1
    const age = Math.round(state.age + progress * totalYears)
    const compoundFactor = Math.pow(progress, 1.32)

    const baseGain = Math.round(
      baseTargetAt65 * contributionRatio * realBaseGrowth * compoundFactor
    )
    const prudentGain = Math.round(
      baseTargetAt65 * contributionRatio * Math.max(0.25, realPrudentGrowth) * compoundFactor
    )
    const optimisticGain = Math.round(
      baseTargetAt65 * contributionRatio * realOptimisticGrowth * compoundFactor
    )

    return {
      age,
      pessimistic: acquiredDays + prudentGain,
      base: acquiredDays + baseGain,
      optimistic: acquiredDays + optimisticGain,
    }
  })

  const at65 = projectionPoints[projectionPoints.length - 1] ?? {
    age: 65,
    pessimistic: acquiredDays,
    base: acquiredDays,
    optimistic: acquiredDays,
  }

  // Dynamic allocation across pension pillars in integer lei
  const excludedHistoryAmountLei = historyItems
    .filter((h) => h.excluded)
    .reduce((sum, h) => sum + h.amountLei, 0)

  const statePensionLei = Math.round((state.salaryBani / 100) * 0.4088) // 1.840 lei at 4.500 lei salary
  const pillar2Lei = 1020
  const pillar3Lei = Math.max(
    120,
    540 +
      Math.round(
        (state.extraContributionLei * riskMeta.allocationSplit.pillar3Pct) / 100
      ) +
      (state.suggestionStatus === 'accepted' ? 50 : 0) -
      Math.round(excludedHistoryAmountLei * 0.6)
  )
  const investmentsLei = Math.max(
    50,
    290 +
      Math.round(
        (state.extraContributionLei *
          (riskMeta.allocationSplit.etfBetPct + riskMeta.allocationSplit.govBondsPct)) /
          100
      ) -
      Math.round(excludedHistoryAmountLei * 0.4)
  )
  const roundUpsAllocationLei = Math.max(0, Math.round(roundUpsBani / 100))

  const totalPensionMonthlyLei =
    statePensionLei + pillar2Lei + pillar3Lei + investmentsLei + roundUpsAllocationLei

  const allocationItems = [
    {
      label: 'Pensie de stat (Pilonul 1 · CNPP)',
      lei: statePensionLei,
      value: formatLei(statePensionLei),
      percent: Math.round((statePensionLei / totalPensionMonthlyLei) * 100),
      color: 'bg-[#33256c]',
    },
    {
      label: 'Pilonul 2 (8,1%/an medie ASF)',
      lei: pillar2Lei,
      value: formatLei(pillar2Lei),
      percent: Math.round((pillar2Lei / totalPensionMonthlyLei) * 100),
      color: 'bg-[#8c7ad9]',
    },
    {
      label: 'Pilonul 3 (7,9%/an medie ASF)',
      lei: pillar3Lei,
      value: formatLei(pillar3Lei),
      percent: Math.round((pillar3Lei / totalPensionMonthlyLei) * 100),
      color: 'bg-[#d7cfff]',
    },
    {
      label: 'Investiții BVB & Fidelis (6,8%–13,4%)',
      lei: investmentsLei,
      value: formatLei(investmentsLei),
      percent: Math.round((investmentsLei / totalPensionMonthlyLei) * 100),
      color: 'bg-[#38bdf8]',
    },
    {
      label: 'Rotunjiri active luna asta',
      lei: roundUpsAllocationLei,
      value: formatLei(roundUpsAllocationLei),
      percent: Math.max(
        1,
        100 -
          Math.round((statePensionLei / totalPensionMonthlyLei) * 100) -
          Math.round((pillar2Lei / totalPensionMonthlyLei) * 100) -
          Math.round((pillar3Lei / totalPensionMonthlyLei) * 100) -
          Math.round((investmentsLei / totalPensionMonthlyLei) * 100)
      ),
      color: 'bg-[#bfe8d1]',
    },
  ]

  // Recent activity items correlated with current round-up & salary rules
  const coffeeRoundUpBani = computeRoundUpBani(
    1230,
    state.roundUpStepLei === 1 ? 5 : state.roundUpStepLei,
    state.roundUpMultiplier
  )
  const groceriesRoundUpBani = computeRoundUpBani(
    8640,
    state.roundUpStepLei === 1 ? 10 : state.roundUpStepLei,
    state.roundUpMultiplier
  )

  const dynamicActivity = [
    ...(state.suggestionStatus === 'accepted'
      ? [
          {
            id: 'bonus-pillar3',
            label: 'Alocare suplimentară → Pilonul 3',
            detail: 'Sugestie Agent AI · azi',
            amount: `+${formatBaniAsLei(5000)}`,
            icon: 'salary' as const,
          },
        ]
      : []),
    ...state.extraPayments.map((p) => {
      const rBani = computeRoundUpBani(
        p.spentBani,
        state.roundUpStepLei,
        state.roundUpMultiplier
      )
      return {
        id: p.id,
        label: `${p.label} · ${formatBaniAsLei(p.spentBani, true)}`,
        detail: `${p.detail} · regulă ${state.roundUpStepLei === 0 ? 'oprită' : `${state.roundUpStepLei} leu ×${state.roundUpMultiplier}`}`,
        amount: `+${formatBaniAsLei(rBani, true)}`,
        icon: p.icon,
      }
    }),
    {
      id: 'salary-rule',
      label: `Salariu → ${state.salaryPercent}% pus deoparte`,
      detail: 'Zi de salariu · azi',
      amount: `+${formatBaniAsLei(paydayBani)}`,
      icon: 'salary' as const,
    },
    {
      id: 'coffee-tx',
      label: 'Cafea · 12,30 lei',
      detail:
        state.roundUpStepLei === 0
          ? 'Rotunjire dezactivată · ieri'
          : `Rotunjire (${state.roundUpStepLei} leu ×${state.roundUpMultiplier}) · ieri`,
      amount: `+${formatBaniAsLei(coffeeRoundUpBani, true)}`,
      icon: 'coffee' as const,
    },
    {
      id: 'groceries-tx',
      label: 'Cumpărături · 86,40 lei',
      detail:
        state.roundUpStepLei === 0
          ? 'Rotunjire dezactivată · ieri'
          : `Rotunjire (${state.roundUpStepLei} leu ×${state.roundUpMultiplier}) · ieri`,
      amount: `+${formatBaniAsLei(groceriesRoundUpBani, true)}`,
      icon: 'cart' as const,
    },
    {
      id: 'fuel-tx',
      label: 'Transport & metrou · 45,00 lei',
      detail: 'Rotunjire acumulată · acum 3 zile',
      amount: `+${formatBaniAsLei(
        computeRoundUpBani(4500, state.roundUpStepLei, state.roundUpMultiplier),
        true
      )}`,
      icon: 'cart' as const,
    },
  ]

  return {
    state,
    riskMeta,
    roundUpsBani,
    paydayBani,
    bonusPillar3Bani,
    moneySavedThisMonthBani,
    moneySavedThisMonthLei,
    totalMonthlyContributionBani,
    totalMonthlyContributionLei,
    daysGainedThisMonth,
    projectedMonthlyDaysWithSlider,
    acquiredDays,
    acquiredRange,
    projectionPoints,
    at65,
    historyItems,
    allocationItems,
    totalPensionMonthlyLei,
    dynamicActivity,
  }
}

export function DaysHero() {
  const [open, setOpen] = useState(false)
  const { acquiredDays, acquiredRange, daysGainedThisMonth, riskMeta } =
    useDerivedFinancials()

  const totalRetirementDaysGoal = 14600 // 40 years * 365 days
  const progressPct = Math.min(
    100,
    Math.max(1.5, Number(((acquiredDays / totalRetirementDaysGoal) * 100).toFixed(1)))
  )

  return (
    <>
      <Card className="relative overflow-hidden !bg-[#33256c] text-white">
        <div className="absolute -right-12 -top-16 size-44 rounded-full bg-[#8c7ad9]/30 blur-2xl" />
        <div className="relative">
          <div className="mb-8 flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-white/80">
              Zile de libertate financiară dobândite
            </span>
            <button
              aria-label="Explică zilele de libertate financiară dobândite"
              onClick={() => setOpen(true)}
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
            >
              <Info size={15} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-end gap-2 text-left"
          >
            <span className="text-[62px] font-semibold leading-none tracking-[-.07em]">
              {formatNumberRo(acquiredDays)}
            </span>
            <span className="mb-1 text-lg text-white/75">zile</span>
          </button>

          <p className="mt-3 text-sm text-white/65">
            între {formatNumberRo(acquiredRange[0])} și {formatNumberRo(acquiredRange[1])}, în
            funcție de piață (risc {riskMeta.labelRo.toLowerCase()} ·{' '}
            {riskMeta.nominalReturnPct.toLocaleString('ro-RO')}%/an)
          </p>

          <div className="mt-5 flex items-center justify-between">
            <span className="rounded-full bg-[#bfe8d1] px-3 py-1.5 text-xs font-semibold text-[#236243]">
              +{formatNumberRo(daysGainedThisMonth)} luna asta
            </span>
            <span className="text-xs text-white/55">
              din {formatNumberRo(totalRetirementDaysGoal)} zile
            </span>
          </div>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-[#38bdf8] transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </Card>

      {open && (
        <div
          className="fixed inset-0 z-30 flex items-end bg-black/40 backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
        >
          <div
            className="mx-auto w-full max-w-[430px] rounded-t-[28px] bg-white p-6 pb-10 dark:bg-[#211d2b]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">De unde vine cifra asta?</h2>
              <button
                aria-label="Închide explicația"
                onClick={() => setOpen(false)}
                className="rounded-full p-1 hover:bg-[#f1effa] dark:hover:bg-[#2b253a]"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm leading-6 text-[#706b7b] dark:text-[#aaa4b6]">
              Estimăm câte zile de cheltuieli la pensie ai acoperite deja (
              <b>{formatNumberRo(acquiredDays)} zile</b>, interval estimat{' '}
              <b>
                {formatNumberRo(acquiredRange[0])}–{formatNumberRo(acquiredRange[1])} zile
              </b>
              ). Calculul folosește randamentele istorice din România pentru profilul tău (
              <b>{riskMeta.labelRo}</b>:{' '}
              <b>{riskMeta.nominalReturnPct.toLocaleString('ro-RO')}%/an</b> nominal) și inflația
              medie pe termen lung în RON (
              <b>{riskMeta.inflationPct.toLocaleString('ro-RO')}%/an</b>).
            </p>

            <div className="mt-4 space-y-1.5 rounded-2xl bg-[#ede9fe] p-3.5 text-xs text-[#3b1d82] dark:bg-[#2a2244] dark:text-[#dcd3fb]">
              <p className="font-semibold">Randamente de referință în România (RON):</p>
              {ROMANIAN_INSTRUMENTS.map((inst) => (
                <div key={inst.name} className="flex items-center justify-between gap-2">
                  <span className="truncate">{inst.name}</span>
                  <b>{inst.ratePct.toLocaleString('ro-RO')}%/an</b>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-[#f1effa] px-3 py-1.5 text-xs font-medium text-[#5f4bb6] dark:bg-[#2b253a] dark:text-[#a594f0]">
                ASF · Pilonul 2 (8,1%) & 3 (7,9%)
              </span>
              <span className="rounded-full bg-[#f1effa] px-3 py-1.5 text-xs font-medium text-[#5f4bb6] dark:bg-[#2b253a] dark:text-[#a594f0]">
                BVB · BET-TR (13,4%)
              </span>
              <span className="rounded-full bg-[#f1effa] px-3 py-1.5 text-xs font-medium text-[#5f4bb6] dark:bg-[#2b253a] dark:text-[#a594f0]">
                MF · Fidelis/Tezaur (6,8%)
              </span>
              <span className="rounded-full bg-[#f1effa] px-3 py-1.5 text-xs font-medium text-[#5f4bb6] dark:bg-[#2b253a] dark:text-[#a594f0]">
                BNR / INS · Inflație (4,0%)
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export function HomeAgentInvite({ setTab }: { setTab: (t: Tab) => void }) {
  const [message, setMessage] = useState('')
  const { moneySavedThisMonthBani, daysGainedThisMonth } = useDerivedFinancials()

  const openAgent = (customText?: string) => {
    const textToSend = (customText ?? message).trim()
    if (textToSend) {
      updateAppState({ pendingAgentPrompt: textToSend })
      setMessage('')
    }
    setTab('agent')
  }

  return (
    <div className="mt-4 rounded-2xl border border-[#c4b5fd]/70 bg-gradient-to-br from-[#ede9fe] via-[#e5defc] to-[#ddd6fe] p-3.5 text-[#2e1065] shadow-[0_8px_22px_rgba(51,37,108,.12)] dark:border-[#5b4b8a]/60 dark:from-[#2a2244] dark:via-[#231c39] dark:to-[#1d1730] dark:text-white">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#33256c] text-white shadow-sm dark:bg-[#5f4bb6]">
          <Bot size={17} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Ai o întrebare despre banii tăi?</p>
              <p className="mt-0.5 text-xs text-[#5b4b8a] dark:text-[#b9b0d4]">
                Vorbește cu Agentul AI despre următorul tău pas.
              </p>
            </div>
            <Sparkles size={16} className="shrink-0 text-[#6d28d9] dark:text-[#a594f0]" />
          </div>

          <p className="mt-3 text-sm leading-5 text-[#3b2d5e] dark:text-[#dcd6ec]">
            Luna asta ai strâns <b>{formatBaniAsLei(moneySavedThisMonthBani)}</b> (+
            {formatNumberRo(daysGainedThisMonth)} zile). Vrei să vezi cum pot deveni mai multe
            zile de libertate financiară?
          </p>

          <div className="mt-3 flex items-center gap-2 rounded-2xl border border-[#c4b5fd]/50 bg-white/95 p-1.5 shadow-sm dark:border-white/10 dark:bg-[#181424]">
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === 'Enter' &&
                  !event.nativeEvent.isComposing &&
                  event.keyCode !== 229
                ) {
                  openAgent()
                }
              }}
              placeholder="Scrie-i Agentului..."
              aria-label="Scrie un mesaj Agentului AI"
              className="min-w-0 flex-1 bg-transparent px-2 text-sm text-[#292431] outline-none placeholder:text-[#8e85a6] dark:text-white"
            />
            <button
              onClick={() => openAgent()}
              aria-label="Deschide conversația cu Agentul AI"
              className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#33256c] text-white transition-transform active:scale-95 dark:bg-[#6f5cc1]"
            >
              <Send size={15} />
            </button>
          </div>

          <button
            onClick={() => openAgent('Cum îmi cresc zilele de libertate financiară dobândite?')}
            className="mt-2 text-left text-xs font-semibold text-[#5b21b6] hover:underline dark:text-[#b8a7f8]"
          >
            Sugestie: Cum îmi cresc zilele de libertate financiară?
          </button>
        </div>
      </div>
    </div>
  )
}

export function HomeScreen({ setTab }: { setTab: (t: Tab) => void }) {
  const [showAllActivity, setShowAllActivity] = useState(false)
  const [showSavedExplain, setShowSavedExplain] = useState(false)

  const {
    state,
    roundUpsBani,
    paydayBani,
    bonusPillar3Bani,
    moneySavedThisMonthBani,
    daysGainedThisMonth,
    dynamicActivity,
  } = useDerivedFinancials()

  const monthlyGoalBani = 30000 // 300 lei reference target for progress bar
  const jarProgressPct = Math.min(
    100,
    Math.round((moneySavedThisMonthBani / monthlyGoalBani) * 100)
  )

  const visibleActivity = showAllActivity
    ? dynamicActivity
    : dynamicActivity.slice(0, 3)

  const handleSimulatePayment = () => {
    const presets: Array<{ label: string; spentBani: number; icon: 'coffee' | 'cart' }> = [
      { label: 'Mega Image', spentBani: 3700, icon: 'cart' },
      { label: '5 to go', spentBani: 1200, icon: 'coffee' },
      { label: 'Cărturești', spentBani: 6400, icon: 'cart' },
    ]
    const nextPreset = presets[state.extraPayments.length % presets.length]
    updateAppState((prev) => ({
      ...prev,
      extraPayments: [
        {
          id: `sim-${Date.now()}`,
          label: nextPreset.label,
          detail: 'Plată card simulată · acum',
          spentBani: nextPreset.spentBani,
          icon: nextPreset.icon,
        },
        ...prev.extraPayments,
      ],
    }))
  }

  return (
    <div>
      <Header title={`Bună, ${state.name}`} subtitle="JOI, 29 OCTOMBRIE" />
      <DaysHero />
      <HomeAgentInvite setTab={setTab} />

      <div className="mt-5 grid gap-5">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.14em] text-[#8c7ad9]">
                Money saved this month
              </p>
              <button
                type="button"
                onClick={() => setShowSavedExplain((v) => !v)}
                className="mt-2 flex items-center gap-2 text-left"
              >
                <h2 className="text-2xl font-semibold">
                  {formatBaniAsLei(moneySavedThisMonthBani)}
                </h2>
                <span className="rounded-full bg-[#e3f5e9] px-2.5 py-0.5 text-xs font-semibold text-[#438565] dark:bg-[#1e3629] dark:text-[#6bc495]">
                  +{formatNumberRo(daysGainedThisMonth)} zile
                </span>
              </button>
              <p className="mt-1 text-sm text-[#858090] dark:text-[#a39cab]">
                puși deoparte în octombrie · țintă {formatBaniAsLei(monthlyGoalBani)} ({jarProgressPct}
                %)
              </p>
            </div>
            <button
              type="button"
              aria-label="Detalii Money saved this month"
              onClick={() => setShowSavedExplain((v) => !v)}
              className="flex size-11 items-center justify-center rounded-2xl border border-[#c4b5fd]/60 bg-[#ede9fe] text-[#5b21b6] shadow-xs transition-transform active:scale-95 dark:border-[#5b4b8a]/60 dark:bg-[#2c2347] dark:text-[#c4b5fd]"
            >
              <PiggyBank size={21} />
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs text-[#858090] dark:text-[#a39cab]">
            <span>{formatBaniAsLei(roundUpsBani)} rotunjiri</span>
            <span>
              {formatBaniAsLei(paydayBani)} salariu ({state.salaryPercent}%)
            </span>
            {bonusPillar3Bani > 0 && (
              <span className="font-semibold text-[#438565] dark:text-[#6bc495]">
                +{formatBaniAsLei(bonusPillar3Bani)} Pilon 3
              </span>
            )}
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#f1effa] dark:bg-[#2b253a]">
            <div
              className="h-full rounded-full bg-[#8c7ad9] transition-all duration-300"
              style={{ width: `${jarProgressPct}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-[#858090] dark:text-[#a39cab]">
            <span>Transfer automat pe 31 octombrie</span>
            <button
              type="button"
              onClick={() => setTab('profile')}
              className="font-semibold text-[#6b57bd] hover:underline dark:text-[#a594f0]"
            >
              Schimbă regulile →
            </button>
          </div>

          {showSavedExplain && (
            <div className="mt-4 rounded-2xl bg-[#f1effa] p-3.5 text-xs leading-5 text-[#706b7b] dark:bg-[#2b253a] dark:text-[#aaa4b6]">
              <p className="font-semibold text-[#5f4bb6] dark:text-[#a594f0]">
                Cum se calculează Money saved this month:
              </p>
              <p className="mt-1">
                • <b>Rotunjiri card ({state.roundUpStepLei === 0 ? 'Oprite' : `la ${state.roundUpStepLei} leu ×${state.roundUpMultiplier}`}):</b>{' '}
                {formatBaniAsLei(roundUpsBani)}
              </p>
              <p>
                • <b>Procent din salariu ({state.salaryPercent}% din {formatBaniAsLei(state.salaryBani)}):</b>{' '}
                {formatBaniAsLei(paydayBani)}
              </p>
              {bonusPillar3Bani > 0 && (
                <p>
                  • <b>Bonus Pilonul 3 aprobat:</b> {formatBaniAsLei(bonusPillar3Bani)}
                </p>
              )}
              <p className="mt-1 text-[11px] text-[#858090] dark:text-[#a39cab]">
                Sursă: Tranzacții PSD2 simulate (Banca Transilvania) & regulă automată Stripe test mode.
              </p>
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Activitate recentă</h2>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSimulatePayment}
                className="inline-flex items-center gap-1 rounded-full bg-[#f1effa] px-2.5 py-1 text-xs font-semibold text-[#6b57bd] transition-transform active:scale-95 dark:bg-[#2b253a] dark:text-[#a594f0]"
              >
                <Plus size={13} />
                Plată test
              </button>
              <button
                type="button"
                onClick={() => setShowAllActivity((prev) => !prev)}
                className="text-xs font-semibold text-[#6b57bd] dark:text-[#a594f0]"
              >
                {showAllActivity ? 'Restrânge' : `Vezi tot (${dynamicActivity.length})`}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {visibleActivity.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-[#f1effa] text-[#6b57bd] dark:bg-[#2b253a] dark:text-[#a594f0]">
                  {item.icon === 'salary' ? (
                    <Banknote size={17} />
                  ) : item.icon === 'coffee' ? (
                    <Coffee size={17} />
                  ) : (
                    <Wallet size={17} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-[#96909f]">{item.detail}</p>
                </div>
                <span className="text-sm font-semibold text-[#438565] dark:text-[#6bc495]">
                  {item.amount}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-[#eadcf4] bg-[#faf7ff] dark:border-white/10 dark:bg-[#262035]">
          <div className="flex gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#e9e2ff] text-[#6b57bd] dark:bg-[#2b253a] dark:text-[#a594f0]">
              {state.suggestionStatus === 'accepted' ? (
                <CheckCircle2 size={18} className="text-[#438565] dark:text-[#6bc495]" />
              ) : (
                <Sparkles size={18} />
              )}
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-[.14em] text-[#8c7ad9]">
                O sugestie de la agent
              </p>

              {state.suggestionStatus === 'pending' && (
                <>
                  <p className="mt-2 text-sm font-medium leading-5">
                    Ți-a crescut salariul cu 500 lei. Punem 50 lei în Pilonul 3 (randament mediu{' '}
                    <b>7,9%/an ASF</b>, deductibil în limita a 400 EUR/an ANAF)?
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => updateAppState({ suggestionStatus: 'accepted' })}
                      className="rounded-full bg-[#33256c] px-4 py-2 text-xs font-semibold text-white transition-transform active:scale-95"
                    >
                      Da, adaugă +50 lei
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateAppState({
                          pendingAgentPrompt:
                            'Explică-mi cum funcționează deducerea de 400 EUR/an la Pilonul 3 dacă pun 50 lei/lună.',
                        })
                        setTab('agent')
                      }}
                      className="rounded-full border border-[#8c7ad9]/40 bg-white px-4 py-2 text-xs font-semibold text-[#6b57bd] dark:bg-[#1e1a29] dark:text-[#a594f0]"
                    >
                      Întreabă Agentul
                    </button>
                    <button
                      type="button"
                      onClick={() => updateAppState({ suggestionStatus: 'dismissed' })}
                      className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#858090] dark:bg-[#1e1a29] dark:text-[#a39cab]"
                    >
                      Nu acum
                    </button>
                  </div>
                </>
              )}

              {state.suggestionStatus === 'accepted' && (
                <>
                  <p className="mt-2 text-sm font-medium leading-5 text-[#438565] dark:text-[#6bc495]">
                    Ai adăugat +50 lei în Pilonul 3! Money saved this month a crescut la{' '}
                    <b>{formatBaniAsLei(moneySavedThisMonthBani)}</b> (+
                    {formatNumberRo(daysGainedThisMonth)} zile luna asta).
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setTab('progress')}
                      className="rounded-full bg-[#33256c] px-3.5 py-1.5 text-xs font-semibold text-white"
                    >
                      Vezi efectul în Progres →
                    </button>
                    <button
                      type="button"
                      onClick={() => updateAppState({ suggestionStatus: 'pending' })}
                      className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#858090] dark:bg-[#1e1a29] dark:text-[#a39cab]"
                    >
                      <RotateCcw size={12} /> Anulează
                    </button>
                  </div>
                </>
              )}

              {state.suggestionStatus === 'dismissed' && (
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="text-xs text-[#858090] dark:text-[#a39cab]">
                    Sugestie amânată pentru luna aceasta.
                  </p>
                  <button
                    type="button"
                    onClick={() => updateAppState({ suggestionStatus: 'pending' })}
                    className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#6b57bd] dark:bg-[#1e1a29] dark:text-[#a594f0]"
                  >
                    <RotateCcw size={12} /> Reafișează
                  </button>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
