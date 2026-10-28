'use client'

import { useState } from 'react'
import {
  Banknote,
  Check,
  ChevronDown,
  ChevronRight,
  Landmark,
  Moon,
  RotateCcw,
  Settings,
  Target,
  Wallet,
} from 'lucide-react'
import type { RiskLevel } from '@/lib/contracts'
import {
  formatBaniAsLei,
  formatLei,
  formatNumberRo,
  resetAppState,
  RISK_CONFIG,
  updateAppState,
  useDerivedFinancials,
} from '@/components/app/home-screen'
import { Card, Header } from '@/components/app/shell'

export function ProfileScreen() {
  const {
    state,
    riskMeta,
    roundUpsBani,
    paydayBani,
    moneySavedThisMonthLei,
    acquiredDays,
  } = useDerivedFinancials()

  const [editingProfile, setEditingProfile] = useState(false)
  const [openSection, setOpenSection] = useState<'risk' | 'roundup' | 'salary' | null>('roundup')
  const [bankReconfirming, setBankReconfirming] = useState(false)

  const [draftFullName, setDraftFullName] = useState(state.fullName)
  const [draftAge, setDraftAge] = useState(String(state.age))
  const [draftCity, setDraftCity] = useState(String(state.city))
  const [draftSalaryLei, setDraftSalaryLei] = useState(String(Math.round(state.salaryBani / 100)))

  const initials = state.fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  const handleOpenProfileEdit = () => {
    if (!editingProfile) {
      setDraftFullName(state.fullName)
      setDraftAge(String(state.age))
      setDraftCity(state.city)
      setDraftSalaryLei(String(Math.round(state.salaryBani / 100)))
    }
    setEditingProfile((prev) => !prev)
  }

  const handleSaveProfile = () => {
    const cleanFull = draftFullName.trim() || 'Andrei Popescu'
    const firstName = cleanFull.split(' ')[0] || 'Andrei'
    const parsedAge = Math.min(60, Math.max(18, Number(draftAge) || 26))
    const parsedSalaryLei = Math.min(50000, Math.max(1500, Number(draftSalaryLei) || 4500))

    updateAppState({
      fullName: cleanFull,
      name: firstName,
      age: parsedAge,
      city: draftCity.trim() || 'București',
      salaryBani: Math.round(parsedSalaryLei * 100),
    })
    setEditingProfile(false)
  }

  const handleReconfirmBank = () => {
    setBankReconfirming(true)
    setTimeout(() => {
      updateAppState({ bankConfirmedDaysAgo: 0 })
      setBankReconfirming(false)
    }, 350)
  }

  const toggleSection = (sec: 'risk' | 'roundup' | 'salary') => {
    setOpenSection((prev) => (prev === sec ? null : sec))
  }

  return (
    <div>
      <Header title="Profilul tău" subtitle={state.fullName.toUpperCase()} />

      <div className="flex flex-col gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#e9e2ff] text-lg font-semibold text-[#5f4bb6] dark:bg-[#2b253a] dark:text-[#a594f0]">
              {initials || 'AP'}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-semibold">{state.fullName}</h2>
              <p className="text-sm text-[#858090] dark:text-[#a39cab]">
                {state.age} ani · {state.city} · Salariu net{' '}
                {formatLei(Math.round(state.salaryBani / 100))}
              </p>
            </div>
            <button
              type="button"
              aria-label="Editează profilul"
              onClick={handleOpenProfileEdit}
              className={`ml-auto flex size-9 items-center justify-center rounded-xl transition-colors ${
                editingProfile
                  ? 'bg-[#33256c] text-white'
                  : 'bg-[#f1effa] text-[#6b57bd] dark:bg-[#2b253a] dark:text-[#a594f0]'
              }`}
            >
              <Settings size={16} />
            </button>
          </div>

          {editingProfile && (
            <div className="mt-4 space-y-3 border-t border-dashed border-[#e2dfe8] pt-4 text-sm dark:border-[#353042]">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#858090] dark:text-[#a39cab]">
                  Nume complet
                </label>
                <input
                  type="text"
                  value={draftFullName}
                  onChange={(e) => setDraftFullName(e.target.value)}
                  className="w-full rounded-xl border border-[#e2dfe8] bg-[#f1effa]/40 px-3 py-2 text-sm outline-none focus:border-[#6f5cc1] dark:border-[#353042] dark:bg-[#2b253a]/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#858090] dark:text-[#a39cab]">
                    Vârstă (18–60)
                  </label>
                  <input
                    type="number"
                    min={18}
                    max={60}
                    value={draftAge}
                    onChange={(e) => setDraftAge(e.target.value)}
                    className="w-full rounded-xl border border-[#e2dfe8] bg-[#f1effa]/40 px-3 py-2 text-sm outline-none focus:border-[#6f5cc1] dark:border-[#353042] dark:bg-[#2b253a]/40"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#858090] dark:text-[#a39cab]">
                    Oraș
                  </label>
                  <input
                    type="text"
                    value={draftCity}
                    onChange={(e) => setDraftCity(e.target.value)}
                    className="w-full rounded-xl border border-[#e2dfe8] bg-[#f1effa]/40 px-3 py-2 text-sm outline-none focus:border-[#6f5cc1] dark:border-[#353042] dark:bg-[#2b253a]/40"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[#858090] dark:text-[#a39cab]">
                  Salariu net lunar (lei)
                </label>
                <input
                  type="number"
                  min={1500}
                  max={50000}
                  step={100}
                  value={draftSalaryLei}
                  onChange={(e) => setDraftSalaryLei(e.target.value)}
                  className="w-full rounded-xl border border-[#e2dfe8] bg-[#f1effa]/40 px-3 py-2 text-sm outline-none focus:border-[#6f5cc1] dark:border-[#353042] dark:bg-[#2b253a]/40"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingProfile(false)}
                  className="rounded-xl bg-[#f1effa] px-3.5 py-2 text-xs font-semibold text-[#706b7b] dark:bg-[#2b253a] dark:text-[#aaa4b6]"
                >
                  Anulează
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="inline-flex items-center gap-1 rounded-xl bg-[#33256c] px-4 py-2 text-xs font-semibold text-white"
                >
                  <Check size={14} /> Salvează
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* Risk Profile Card */}
        <Card>
          <button
            type="button"
            onClick={() => toggleSection('risk')}
            className="flex w-full items-center gap-3 text-left"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f1effa] text-[#6b57bd] dark:bg-[#2b253a] dark:text-[#a594f0]">
              <Target size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Profil de risc</p>
              <p className="text-xs text-[#858090] dark:text-[#a39cab]">{riskMeta.subtitleRo}</p>
            </div>
            {openSection === 'risk' ? (
              <ChevronDown className="text-[#858090]" size={17} />
            ) : (
              <ChevronRight className="text-[#858090]" size={17} />
            )}
          </button>

          {openSection === 'risk' && (
            <div className="mt-4 space-y-3 border-t border-dashed border-[#e2dfe8] pt-4 dark:border-[#353042]">
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as RiskLevel[]).map((level) => {
                  const cfg = RISK_CONFIG[level]
                  const active = state.risk === level
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => updateAppState({ risk: level })}
                      className={`rounded-xl p-2.5 text-left transition-colors ${
                        active
                          ? 'bg-[#33256c] text-white'
                          : 'bg-[#f1effa] text-[#706b7b] dark:bg-[#2b253a] dark:text-[#aaa4b6]'
                      }`}
                    >
                      <p className="text-xs font-semibold">{cfg.labelRo}</p>
                      <p
                        className={`mt-0.5 text-[11px] ${
                          active ? 'text-white/80' : 'text-[#858090] dark:text-[#a39cab]'
                        }`}
                      >
                        ~{cfg.nominalReturnPct.toLocaleString('ro-RO')}%/an
                      </p>
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-[#858090] dark:text-[#a39cab]">
                Alocare țintă România: <b>{riskMeta.instrumentsSummaryRo}</b> (inflație medie BNR/INS{' '}
                <b>{riskMeta.inflationPct.toLocaleString('ro-RO')}%/an</b>).
              </p>
            </div>
          )}
        </Card>

        {/* Rules Card: Round-ups & Salary % */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Regulile tale</h2>
            <span className="rounded-full bg-[#e3f5e9] px-2.5 py-1 text-xs font-semibold text-[#438565] dark:bg-[#1e3629] dark:text-[#6bc495]">
              {formatLei(moneySavedThisMonthLei)} luna asta ({formatNumberRo(acquiredDays)}z total)
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {/* Round-up rule */}
            <div className="rounded-2xl border border-[#e2dfe8] p-3 dark:border-[#353042]">
              <button
                type="button"
                onClick={() => toggleSection('roundup')}
                className="flex w-full items-center gap-3 text-left"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#c4b5fd]/60 bg-[#ede9fe] text-[#5b21b6] dark:border-[#5b4b8a]/60 dark:bg-[#2c2347] dark:text-[#c4b5fd]">
                  <Wallet size={17} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {state.roundUpStepLei === 0
                      ? 'Rotunjiri dezactivate'
                      : `Rotunjiri la ${state.roundUpStepLei} ${
                          state.roundUpStepLei === 1 ? 'leu' : 'lei'
                        }${state.roundUpMultiplier > 1 ? ` (×${state.roundUpMultiplier})` : ''}`}
                  </p>
                  <p className="text-xs text-[#858090] dark:text-[#a39cab]">
                    La fiecare plată cu cardul · {formatBaniAsLei(roundUpsBani)} strânși luna asta
                  </p>
                </div>
                {openSection === 'roundup' ? (
                  <ChevronDown size={16} className="text-[#858090]" />
                ) : (
                  <ChevronRight size={16} className="text-[#858090]" />
                )}
              </button>

              {openSection === 'roundup' && (
                <div className="mt-3 space-y-3 border-t border-dashed border-[#e2dfe8] pt-3 dark:border-[#353042]">
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-[#858090] dark:text-[#a39cab]">
                      Prag de rotunjire plată card
                    </p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {([0, 1, 5, 10] as const).map((step) => (
                        <button
                          key={step}
                          type="button"
                          onClick={() => updateAppState({ roundUpStepLei: step })}
                          className={`rounded-xl py-2 text-xs font-semibold transition-colors ${
                            state.roundUpStepLei === step
                              ? 'bg-[#33256c] text-white'
                              : 'bg-[#f1effa] text-[#706b7b] dark:bg-[#2b253a] dark:text-[#aaa4b6]'
                          }`}
                        >
                          {step === 0 ? 'Oprit' : `${step} ${step === 1 ? 'leu' : 'lei'}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1.5 text-xs font-medium text-[#858090] dark:text-[#a39cab]">
                      Multiplicator rotunjire (accelerează economisirea)
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {([1, 2, 3] as const).map((mult) => (
                        <button
                          key={mult}
                          type="button"
                          disabled={state.roundUpStepLei === 0}
                          onClick={() => updateAppState({ roundUpMultiplier: mult })}
                          className={`rounded-xl py-1.5 text-xs font-semibold transition-colors ${
                            state.roundUpMultiplier === mult && state.roundUpStepLei !== 0
                              ? 'bg-[#6f5cc1] text-white'
                              : 'bg-[#f1effa] text-[#706b7b] disabled:opacity-40 dark:bg-[#2b253a] dark:text-[#aaa4b6]'
                          }`}
                        >
                          ×{mult} ({mult === 1 ? 'Standard' : mult === 2 ? 'Dublu' : 'Triplu'})
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Salary % rule */}
            <div className="rounded-2xl border border-[#e2dfe8] p-3 dark:border-[#353042]">
              <button
                type="button"
                onClick={() => toggleSection('salary')}
                className="flex w-full items-center gap-3 text-left"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#e3f5e9] text-[#438565] dark:bg-[#1e3629] dark:text-[#6bc495]">
                  <Banknote size={17} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{state.salaryPercent}% din salariu</p>
                  <p className="text-xs text-[#858090] dark:text-[#a39cab]">
                    În ziua de salariu · {formatBaniAsLei(paydayBani)} din{' '}
                    {formatBaniAsLei(state.salaryBani)}
                  </p>
                </div>
                {openSection === 'salary' ? (
                  <ChevronDown size={16} className="text-[#858090]" />
                ) : (
                  <ChevronRight size={16} className="text-[#858090]" />
                )}
              </button>

              {openSection === 'salary' && (
                <div className="mt-3 border-t border-dashed border-[#e2dfe8] pt-3 dark:border-[#353042]">
                  <p className="mb-1.5 text-xs font-medium text-[#858090] dark:text-[#a39cab]">
                    Procent transferat automat în ziua de salariu
                  </p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {([0, 1, 3, 5, 10] as const).map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => updateAppState({ salaryPercent: pct })}
                        className={`rounded-xl py-2 text-xs font-semibold transition-colors ${
                          state.salaryPercent === pct
                            ? 'bg-[#33256c] text-white'
                            : 'bg-[#f1effa] text-[#706b7b] dark:bg-[#2b253a] dark:text-[#aaa4b6]'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Connected Bank PSD2 Card */}
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e3f5e9] text-[#438565] dark:bg-[#1e3629] dark:text-[#6bc495]">
              <Landmark size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{state.bankName}</p>
              <p className="text-xs text-[#858090] dark:text-[#a39cab]">
                {state.bankConfirmedDaysAgo === 0
                  ? 'Acces PSD2 reconfirmat azi · valabil 90 zile'
                  : `Acces reconfirmat acum ${state.bankConfirmedDaysAgo} zile`}
              </p>
            </div>
            <span className="size-2.5 rounded-full bg-[#55a477]" />
          </div>

          <button
            type="button"
            disabled={bankReconfirming}
            onClick={handleReconfirmBank}
            className="mt-5 w-full rounded-xl border border-[#ddd8e6] py-3 text-sm font-semibold text-[#5f4bb6] transition-colors hover:bg-[#f1effa] disabled:opacity-60 dark:border-[#353042] dark:text-[#a594f0] dark:hover:bg-[#2b253a]"
          >
            {bankReconfirming
              ? 'Se reconfirmă conexiunea PSD2...'
              : state.bankConfirmedDaysAgo === 0
                ? '✓ Acces bancar reconfirmat azi'
                : 'Reconfirmă accesul la bancă'}
          </button>
        </Card>

        {/* Dark mode & Reset Demo State */}
        <Card>
          <div className="flex items-center gap-3">
            <Moon size={18} className="text-[#6b57bd] dark:text-[#a594f0]" />
            <span className="flex-1 text-sm font-medium">Aspect întunecat</span>
            <button
              type="button"
              role="switch"
              aria-checked={state.darkMode}
              aria-label="Comută aspectul întunecat"
              onClick={() => updateAppState({ darkMode: !state.darkMode })}
              className={`flex h-7 w-12 items-center rounded-full p-1 transition-colors ${
                state.darkMode ? 'bg-[#6f5cc1]' : 'bg-[#dcd8e3]'
              }`}
            >
              <span
                className={`size-5 rounded-full bg-white shadow-sm transition-transform ${
                  state.darkMode ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>

          <div className="mt-4 border-t border-dashed border-[#e2dfe8] pt-3 dark:border-[#353042]">
            <button
              type="button"
              onClick={resetAppState}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#f1effa] py-2.5 text-xs font-semibold text-[#706b7b] transition-colors hover:text-[#5f4bb6] dark:bg-[#2b253a] dark:text-[#aaa4b6]"
            >
              <RotateCcw size={13} /> Resetează toate setările la valorile inițiale
            </button>
          </div>
        </Card>
      </div>
    </div>
  )
}
