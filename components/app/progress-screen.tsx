'use client'

import { useState } from 'react'
import { CircleHelp, RotateCcw, Target, Trash2, X } from 'lucide-react'
import type { RiskLevel } from '@/lib/contracts'
import {
  formatLei,
  formatNumberRo,
  RISK_CONFIG,
  ROMANIAN_INSTRUMENTS,
  updateAppState,
  useDerivedFinancials,
} from '@/components/app/home-screen'
import { Card, Header } from '@/components/app/shell'
import { money } from '@/components/app/types'

function buildSvgPath(
  points: Array<{ x: number; y: number }>,
  closeAreaBottomY?: number
): string {
  if (points.length === 0) return ''
  const parts = points.map((pt, idx) =>
    idx === 0 ? `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}` : `L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`
  )
  if (typeof closeAreaBottomY === 'number' && points.length > 1) {
    const last = points[points.length - 1]
    const first = points[0]
    parts.push(`L ${last.x.toFixed(1)} ${closeAreaBottomY.toFixed(1)}`)
    parts.push(`L ${first.x.toFixed(1)} ${closeAreaBottomY.toFixed(1)} Z`)
  }
  return parts.join(' ')
}

export function ProgressScreen() {
  const [showInfo, setShowInfo] = useState(false)
  const [showRoRates, setShowRoRates] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)

  const {
    state,
    riskMeta,
    moneySavedThisMonthLei,
    totalMonthlyContributionLei,
    projectedMonthlyDaysWithSlider,
    acquiredDays,
    projectionPoints,
    at65,
    historyItems,
    allocationItems,
    totalPensionMonthlyLei,
  } = useDerivedFinancials()

  const activePointIndex =
    selectedIdx !== null && selectedIdx < projectionPoints.length
      ? selectedIdx
      : projectionPoints.length - 1
  const inspectedPoint = projectionPoints[activePointIndex] ?? at65

  // Compute SVG coordinates dynamically from projectionPoints
  const svgWidth = 360
  const svgHeight = 190
  const padTop = 14
  const padBottom = 24
  const usableHeight = svgHeight - padTop - padBottom

  // Fixed ceiling scale so moving the slider visibly lifts/lowers the curves
  const maxScaleDays = Math.max(12000, at65.optimistic * 1.05)
  const minScaleDays = 0

  const mapY = (days: number) => {
    const clamped = Math.max(minScaleDays, Math.min(maxScaleDays, days))
    const ratio = (clamped - minScaleDays) / (maxScaleDays - minScaleDays || 1)
    return padTop + usableHeight * (1 - ratio)
  }

  const count = Math.max(1, projectionPoints.length - 1)
  const baseCoords = projectionPoints.map((p, i) => ({
    x: (i / count) * svgWidth,
    y: mapY(p.base),
  }))
  const optimisticCoords = projectionPoints.map((p, i) => ({
    x: (i / count) * svgWidth,
    y: mapY(p.optimistic),
  }))
  const prudentCoords = projectionPoints.map((p, i) => ({
    x: (i / count) * svgWidth,
    y: mapY(p.pessimistic),
  }))

  const areaPath = buildSvgPath(baseCoords, svgHeight - padBottom + 6)
  const basePath = buildSvgPath(baseCoords)
  const optimisticPath = buildSvgPath(optimisticCoords)
  const prudentPath = buildSvgPath(prudentCoords)

  const activeCoord = baseCoords[activePointIndex] ?? { x: svgWidth, y: mapY(at65.base) }

  const toggleMonthExclusion = (monthId: string) => {
    updateAppState((prev) => {
      const exists = prev.excludedMonths.includes(monthId)
      return {
        ...prev,
        excludedMonths: exists
          ? prev.excludedMonths.filter((m) => m !== monthId)
          : [...prev.excludedMonths, monthId],
      }
    })
  }

  const excludedCount = state.excludedMonths.length
  const realNetReturnPct = Number(
    (riskMeta.nominalReturnPct - riskMeta.inflationPct).toFixed(1)
  )

  return (
    <div>
      <Header title="Progresul tău" subtitle="CUM CREȘTE LIBERTATEA" />

      <div className="mb-5 flex items-end justify-between gap-2">
        <div>
          <p className="text-sm text-ink-muted">
            La {inspectedPoint.age} de ani, ai putea avea
          </p>
          <p className="text-4xl font-semibold tracking-[-.06em] text-brand-deep dark:text-white">
            {formatNumberRo(inspectedPoint.base)} zile
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            Interval: {formatNumberRo(inspectedPoint.pessimistic)} (prudent) –{' '}
            {formatNumberRo(inspectedPoint.optimistic)} zile (optimist)
          </p>
        </div>
        <div className="text-right">
          <span className="inline-block rounded-full bg-mint-soft px-3 py-1.5 text-xs font-semibold text-mint-text">
            +{formatNumberRo(projectedMonthlyDaysWithSlider)} luna asta
          </span>
          <p className="mt-1.5 text-[11px] text-ink-muted">
            Azi: <b>{formatNumberRo(acquiredDays)} zile</b> dobândite
          </p>
        </div>
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Proiecția ta</h2>
            <p className="text-xs text-ink-muted">
              Apasă pe grafic pentru a vedea vârsta · Bază: {formatLei(totalMonthlyContributionLei)}/lună
            </p>
          </div>
          <button
            type="button"
            aria-label="Informații despre proiecție"
            onClick={() => setShowInfo((v) => !v)}
            className="rounded-full p-1 text-ink-muted hover:bg-brand-soft"
          >
            <CircleHelp size={18} />
          </button>
        </div>

        {showInfo && (
          <div className="mb-4 rounded-2xl bg-[#ede9fe] p-3.5 text-xs leading-5 text-[#3b1d82] dark:bg-[#2a2244] dark:text-[#dcd3fb]">
            <div className="flex items-center justify-between font-semibold">
              <span>Metodologie și ipoteze România (ASF / BVB / MF / BNR)</span>
              <button
                type="button"
                aria-label="Închide detalii metodologie"
                onClick={() => setShowInfo(false)}
              >
                <X size={14} />
              </button>
            </div>
            <p className="mt-1">
              Proiecția pornește de la cele <b>{formatNumberRo(acquiredDays)} zile de libertate financiară dobândite</b>{' '}
              și adaugă <b>Money saved this month ({formatLei(moneySavedThisMonthLei)})</b> + suplimentul din slider (
              <b>+{formatLei(state.extraContributionLei)}/lună</b>), compus la randamentul istoric al
              instrumentelor din România ({riskMeta.instrumentsSummaryRo}).
            </p>
          </div>
        )}

        <div className="relative h-48 select-none">
          <div className="absolute inset-x-0 top-4 border-t border-dashed border-line-dashed" />
          <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-line-dashed" />
          <div className="absolute inset-x-0 bottom-6 border-t border-dashed border-line-dashed" />

          <svg
            className="absolute inset-0 h-full w-full overflow-visible"
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            preserveAspectRatio="none"
          >
            <path d={areaPath} fill="var(--brand-tint)" className="transition-all duration-300" />
            <path
              d={optimisticPath}
              fill="none"
              stroke="#0ea5e9"
              strokeDasharray="5 5"
              strokeWidth="2"
              className="transition-all duration-300"
            />
            <path
              d={prudentPath}
              fill="none"
              stroke="#a8a1b5"
              strokeDasharray="5 5"
              strokeWidth="2"
              className="transition-all duration-300"
            />
            <path
              d={basePath}
              fill="none"
              stroke="var(--brand-primary)"
              strokeWidth="3"
              className="transition-all duration-300"
            />
            <line
              x1={activeCoord.x}
              y1={padTop}
              x2={activeCoord.x}
              y2={svgHeight - padBottom + 6}
              stroke="var(--brand-lavender)"
              strokeDasharray="3 3"
              strokeWidth="1.5"
            />
            <circle
              cx={activeCoord.x}
              cy={activeCoord.y}
              r="5"
              fill="var(--brand-deep)"
              stroke="#ffffff"
              strokeWidth="2"
            />
          </svg>

          {/* Interactive age columns overlay */}
          <div className="absolute inset-x-0 top-0 bottom-6 grid grid-cols-13">
            {projectionPoints.map((pt, idx) => (
              <button
                key={pt.age}
                type="button"
                aria-label={`Vezi proiecția la ${pt.age} ani`}
                onClick={() => setSelectedIdx(idx)}
                className="h-full w-full opacity-0"
              />
            ))}
          </div>

          <div className="absolute bottom-0 flex w-full justify-between text-[10px] font-medium text-ink-muted">
            {[0, 3, 8, 12].map((idx) => {
              const pt = projectionPoints[idx]
              if (!pt) return null
              const isSelected = activePointIndex === idx
              return (
                <button
                  key={pt.age}
                  type="button"
                  onClick={() => setSelectedIdx(idx)}
                  className={`rounded px-1 py-0.5 transition-colors ${
                    isSelected
                      ? 'bg-brand-deep text-white'
                      : 'hover:bg-brand-soft hover:text-brand-medium'
                  }`}
                >
                  {idx === 12 ? `${pt.age} ani` : pt.age}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-muted">
          <div className="flex gap-4">
            <span>
              <i className="mr-1 inline-block size-2 rounded-full bg-brand-primary" />
              Bază ({formatNumberRo(inspectedPoint.base)}z)
            </span>
            <span>
              <i className="mr-1 inline-block size-2 rounded-full bg-[#0ea5e9]" />
              Optimist ({formatNumberRo(inspectedPoint.optimistic)}z)
            </span>
            <span>
              <i className="mr-1 inline-block size-2 rounded-full bg-chart-prudent" />
              Prudent ({formatNumberRo(inspectedPoint.pessimistic)}z)
            </span>
          </div>
          {selectedIdx !== null && selectedIdx !== projectionPoints.length - 1 && (
            <button
              type="button"
              onClick={() => setSelectedIdx(null)}
              className="font-semibold text-brand-accent"
            >
              Vezi la 65 ani
            </button>
          )}
        </div>
      </Card>

      <Card className="mt-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Joacă-te cu scenariul</h2>
          <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand-medium">
            Total: {formatLei(totalMonthlyContributionLei)}/lună
          </span>
        </div>

        <label
          htmlFor="extra-contribution-slider"
          className="mb-2 flex items-center justify-between text-sm"
        >
          <span>Contribuție lunară suplimentară</span>
          <b className="text-brand-medium">+{formatLei(state.extraContributionLei)}/lună</b>
        </label>

        <input
          id="extra-contribution-slider"
          aria-label="Contribuție lunară suplimentară"
          type="range"
          min="0"
          max="500"
          step="10"
          value={state.extraContributionLei}
          onChange={(e) =>
            updateAppState({ extraContributionLei: Number(e.target.value) })
          }
          className="w-full accent-brand-primary"
        />

        <div className="mt-2 flex justify-between text-[11px] text-ink-muted">
          {[0, 100, 250, 500].map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => updateAppState({ extraContributionLei: val })}
              className={`rounded-full px-2 py-0.5 font-medium transition-colors ${
                state.extraContributionLei === val
                  ? 'bg-brand-deep text-white'
                  : 'bg-brand-soft text-ink-subtle'
              }`}
            >
              +{val} lei
            </button>
          ))}
        </div>

        <p className="mt-3 text-xs text-ink-muted">
          Money saved this month: <b>{formatLei(moneySavedThisMonthLei)}</b> + supliment slider{' '}
          <b>{formatLei(state.extraContributionLei)}</b> ={' '}
          <b>{formatLei(totalMonthlyContributionLei)}/lună</b>
        </p>

        <div className="mt-5 border-t border-line-dashed pt-4">
          <div className="mb-2 flex items-center justify-between text-xs text-ink-muted">
            <span>Profil de risc simulat (piața din România)</span>
            <span className="font-semibold text-brand-medium">{riskMeta.labelRo}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(['low', 'medium', 'high'] as RiskLevel[]).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => updateAppState({ risk: level })}
                className={`rounded-xl py-2 text-xs font-semibold transition-colors ${
                  state.risk === level
                    ? 'bg-brand-deep text-white'
                    : 'bg-brand-soft text-ink-subtle'
                }`}
              >
                {RISK_CONFIG[level].labelRo} ({RISK_CONFIG[level].nominalReturnPct.toLocaleString('ro-RO')}%)
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-ink-muted">
            Coș: {riskMeta.instrumentsSummaryRo}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-ink-muted">Randament nominal mediu (RON)</span>
          <b className="text-sm text-brand-medium">
            {riskMeta.nominalReturnPct.toLocaleString('ro-RO')}% / an
          </b>
        </div>
        <div className="mt-2.5 flex items-center justify-between">
          <span className="text-sm text-ink-muted">Inflație medie pe termen lung (BNR/INS)</span>
          <b className="text-sm">{riskMeta.inflationPct.toLocaleString('ro-RO')}% / an</b>
        </div>
        <div className="mt-2.5 flex items-center justify-between">
          <span className="text-sm text-ink-muted">Randament real net (peste inflație)</span>
          <b className="text-sm text-mint-text">
            +{realNetReturnPct.toLocaleString('ro-RO')}% / an
          </b>
        </div>

        <div className="mt-4 border-t border-line-dashed pt-3">
          <button
            type="button"
            onClick={() => setShowRoRates((v) => !v)}
            className="flex w-full items-center justify-between text-left text-xs font-semibold text-brand-accent"
          >
            <span>
              {showRoRates
                ? 'Ascunde dobânzile și randamentele din România'
                : 'Vezi dobânzile oficiale din România (Fidelis, Pilon 2/3, BVB) →'}
            </span>
          </button>

          {showRoRates && (
            <div className="mt-3 space-y-2.5 rounded-2xl bg-[#ede9fe]/70 p-3 text-xs dark:bg-[#2a2244]">
              {ROMANIAN_INSTRUMENTS.map((inst) => (
                <div
                  key={inst.name}
                  className="flex items-start justify-between gap-2 border-b border-brand-lavender/20 pb-2 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-semibold text-brand-deep dark:text-white">{inst.name}</p>
                    <p className="text-[11px] text-ink-muted">
                      {inst.taxNote} · Sursă: {inst.source}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="rounded-full bg-brand-deep px-2 py-0.5 text-[11px] font-semibold text-white dark:bg-[#5f4bb6]">
                      {inst.ratePct.toLocaleString('ro-RO')}%/an
                    </span>
                    <p className="mt-0.5 text-[10px] text-ink-muted">{inst.rangeText}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Card className="mt-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Toată pensia ta într-un loc</h2>
          <span className="text-xs font-semibold text-brand-medium">
            ~{formatLei(totalPensionMonthlyLei)}/lună
          </span>
        </div>

        <div className="mb-5 flex h-3 overflow-hidden rounded-full">
          {allocationItems.map((item) => (
            <div
              key={item.label}
              className={`${item.color} transition-all duration-300`}
              style={{ width: `${item.percent}%` }}
            />
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {allocationItems.map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-sm">
              <span className={`size-2.5 shrink-0 rounded-full ${item.color}`} />
              <span className="flex-1 text-ink-subtle">{item.label}</span>
              <span className="text-xs text-ink-muted">{item.percent}%</span>
              <b>{item.value}</b>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Istoric lunar</h2>
          {excludedCount > 0 && (
            <button
              type="button"
              onClick={() => updateAppState({ excludedMonths: [] })}
              className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand-accent"
            >
              <RotateCcw size={12} /> Restaurează tot ({excludedCount})
            </button>
          )}
        </div>
        <p className="mb-4 text-xs text-ink-muted">
          Dacă nu ai finalizat o investiție promisă Agentului AI, o poți elimina din grafic pentru o
          reprezentare 100% realistă.
        </p>

        <div className="flex flex-col gap-4">
          {historyItems.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 rounded-2xl p-2 transition-opacity ${
                item.excluded ? 'bg-brand-soft/50 opacity-55' : ''
              }`}
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-accent">
                <Target size={16} />
              </div>

              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium ${item.excluded ? 'line-through' : ''}`}>
                  {item.monthRo}
                </p>
                <p className="text-xs text-ink-faint">
                  {item.excluded ? 'Investiție exclusă din grafic' : item.destinationRo}
                </p>
              </div>

              <div className="text-right">
                <p className={`text-sm font-semibold ${item.excluded ? 'line-through' : ''}`}>
                  +{formatNumberRo(item.days)} zile
                </p>
                <p className="text-xs text-mint-text">{money(item.amountLei)}</p>
              </div>

              <button
                type="button"
                aria-label={
                  item.excluded
                    ? `Restaurează tranzacția din ${item.monthRo}`
                    : `Șterge tranzacția din ${item.monthRo} din grafic`
                }
                onClick={() => toggleMonthExclusion(item.id)}
                className={`flex size-8 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                  item.excluded
                    ? 'border-brand-lavender/40 bg-white text-brand-accent dark:bg-[#1e1a29]'
                    : 'border-transparent bg-brand-soft text-ink-muted hover:text-destructive'
                }`}
              >
                {item.excluded ? <RotateCcw size={14} /> : <Trash2 size={14} />}
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
