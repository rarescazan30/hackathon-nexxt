'use client'

import { FormEvent, useRef, useState } from 'react'
import {
  ArrowRight,
  Bot,
  Calculator,
  Check,
  ExternalLink,
  RefreshCw,
  Send,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  User,
} from 'lucide-react'
import { Card, Header } from '@/components/app/shell'
import { updateAppState } from '@/components/app/home-screen'
import type { Chunk, RiskLevel } from '@/lib/contracts'
import { formatBaniToLei, type RoundUpRule } from '@/lib/rules'
import {
  type AgentRunOutput,
  type AgentToolResult,
  DEFAULT_USER_CONTEXT,
  describeRiskLevelRo,
  executeUpdateRoundUpRule,
  loadUserFinancialContext,
  saveUserFinancialContext,
  type UserFinancialContext,
} from '@/lib/ai'

interface ChatMessage {
  id: string
  role: 'assistant' | 'user'
  content: string
  provider?: string
  toolResult?: AgentToolResult
  sources?: Chunk[]
}

const QUICK_PROMPTS = [
  'Ce-ar fi dacă rotunjesc la 10 lei?',
  'Setează rotunjirea la 10 lei',
  'Setează 20% round-up',
  'Dacă adaug 200 lei/lună?',
  'Cum ai calculat cifra de mai sus?',
  'De unde vine 209 lei?',
  'Ce e un ETF?',
]

function renderFormattedText(text: string) {
  const paragraphs = text.split('\n\n')
  return paragraphs.map((para, pIdx) => {
    const parts = para.split(/(\*\*.*?\*\*|\*.*?\*)/g)
    return (
      <p key={pIdx} className={pIdx > 0 ? 'mt-2.5' : ''}>
        {parts.map((part, idx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={idx} className="font-semibold text-[#292431] dark:text-white">
                {part.slice(2, -2)}
              </strong>
            )
          }
          if (part.startsWith('*') && part.endsWith('*')) {
            return (
              <em key={idx} className="italic">
                {part.slice(1, -1)}
              </em>
            )
          }
          return <span key={idx}>{part}</span>
        })}
      </p>
    )
  })
}

function ToolResultCard({
  result,
  onApplyRule,
}: {
  result: AgentToolResult
  onApplyRule: (rule: RoundUpRule, label: string) => void
}) {
  if (result.kind === 'roundup_updated') {
    const isSimulated = result.mode === 'simulated'
    return (
      <div className="mt-3 rounded-xl border border-[#dfd8ef] bg-[#faf8ff] p-3.5 text-xs dark:border-[#342e45] dark:bg-[#191622]">
        <div className="flex items-center justify-between border-b border-[#e7e1f5] pb-2 dark:border-[#2e283d]">
          <span
            className={`font-semibold uppercase tracking-wider ${
              isSimulated ? 'text-[#c9824e]' : 'text-[#307052]'
            }`}
          >
            {isSimulated ? 'Simulare „Ce-ar fi dacă”' : 'Regulă activată în cont'}
          </span>
          <span className="rounded-full bg-[#e4f5eb] px-2 py-0.5 text-[10px] font-semibold text-[#307052]">
            +{result.monthlyDaysAdded.base} zile/lună
          </span>
        </div>

        {isSimulated && result.previousMonthlyTotalFormatted && (
          <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg bg-white p-2 text-[11px] dark:bg-[#211d2b]">
            <div>
              <p className="text-[10px] text-[#8c8496]">Setarea ta actuală</p>
              <p className="font-semibold text-[#292431] dark:text-white">
                {result.previousMonthlyTotalFormatted}/lună
              </p>
              <p className="text-[10px] text-[#8c8496]">+{result.previousMonthlyDaysBase} zile/lună</p>
            </div>
            <div className="border-l border-[#e7e1f5] pl-2 dark:border-[#342e45]">
              <p className="text-[10px] font-semibold text-[#6b57bd]">Cu această simulare</p>
              <p className="font-bold text-[#307052]">{result.newMonthlyTotalFormatted}/lună</p>
              <p className="text-[10px] font-semibold text-[#307052]">
                +{result.monthlyDaysAdded.base} zile/lună
              </p>
            </div>
          </div>
        )}

        <p className="mt-2 font-medium text-[#292431] dark:text-[#f8f6fb]">
          {result.ruleLabelRo}
        </p>
        <div className="mt-2 space-y-1.5">
          {result.sampleTransactions.slice(0, 3).map((tx) => (
            <div
              key={tx.label}
              className="flex items-center justify-between rounded-lg bg-white px-2.5 py-1.5 text-[11px] shadow-2xs dark:bg-[#211d2b]"
            >
              <span className="text-[#706b7b] dark:text-[#a9a2b8]">
                {tx.label} ({tx.spentFormatted})
              </span>
              <span className="font-semibold text-[#307052]">
                {tx.roundUpFormatted}{' '}
                <span className="font-normal text-[#8c8496]">→ {tx.totalToPayFormatted}</span>
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2.5 flex items-center justify-between pt-1 text-[11px] text-[#706b7b]">
          <span>Total pușculiță + 3% salariu:</span>
          <b className="text-[#33256c] dark:text-[#d7cfff]">{result.newMonthlyTotalFormatted}/lună</b>
        </div>

        {isSimulated && (
          <button
            type="button"
            onClick={() =>
              onApplyRule(result.rule, `Setează regula: ${result.ruleLabelRo}`)
            }
            className="mt-3 w-full rounded-lg bg-[#33256c] py-2 text-[11px] font-semibold text-white transition hover:bg-[#43328a]"
          >
            Activează această regulă în cont
          </button>
        )}
      </div>
    )
  }

  if (result.kind === 'projection_calculated') {
    return (
      <div className="mt-3 rounded-xl border border-[#dfd8ef] bg-[#faf8ff] p-3.5 text-xs dark:border-[#342e45] dark:bg-[#191622]">
        <div className="flex items-center justify-between border-b border-[#e7e1f5] pb-2 dark:border-[#2e283d]">
          <span className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-[#6b57bd]">
            <TrendingUp size={13} /> Simulare pe {result.years} ani
          </span>
          {result.extraMonthlyBani > 0 && (
            <span className="rounded-full bg-[#e4f5eb] px-2 py-0.5 text-[10px] font-semibold text-[#307052]">
              +{result.extraDaysGained.base} zile câștigate
            </span>
          )}
        </div>
        <div className="mt-2.5 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-white p-2 dark:bg-[#211d2b]">
            <p className="text-[10px] text-[#8c8496]">Pesimist</p>
            <p className="mt-0.5 font-semibold text-[#292431] dark:text-white">
              {result.projectedDaysOfFreedom.pessimistic} zile
            </p>
            <p className="text-[10px] text-[#8c8496]">{result.projectedPortfolioFormatted.pessimistic}</p>
          </div>
          <div className="rounded-lg border border-[#8c7ad9] bg-[#f3f0ff] p-2 dark:bg-[#2b2440]">
            <p className="text-[10px] font-semibold text-[#6b57bd]">Bază (4,5%)</p>
            <p className="mt-0.5 font-bold text-[#33256c] dark:text-white">
              {result.projectedDaysOfFreedom.base} zile
            </p>
            <p className="text-[10px] text-[#6b57bd]">{result.projectedPortfolioFormatted.base}</p>
          </div>
          <div className="rounded-lg bg-white p-2 dark:bg-[#211d2b]">
            <p className="text-[10px] text-[#8c8496]">Optimist</p>
            <p className="mt-0.5 font-semibold text-[#307052]">
              {result.projectedDaysOfFreedom.optimistic} zile
            </p>
            <p className="text-[10px] text-[#8c8496]">{result.projectedPortfolioFormatted.optimistic}</p>
          </div>
        </div>
      </div>
    )
  }

  if (result.kind === 'allocation_changed') {
    return (
      <div className="mt-3 rounded-xl border border-[#dfd8ef] bg-[#faf8ff] p-3.5 text-xs dark:border-[#342e45] dark:bg-[#191622]">
        <div className="flex items-center justify-between border-b border-[#e7e1f5] pb-2 dark:border-[#2e283d]">
          <span className="font-semibold uppercase tracking-wider text-[#6b57bd]">
            {result.mode === 'simulated' ? 'Simulare ' : 'Activat: '}Profil {result.riskLabelRo}
          </span>
          <span className="text-[11px] font-semibold text-[#438565]">
            +{result.monthlyDaysAdded.base} zile/lună
          </span>
        </div>
        <div className="mt-2.5 space-y-1.5">
          {result.allocation.breakdown
            .filter((item) => item.amountBani > 0)
            .map((item) => (
              <div key={item.productId} className="flex items-center justify-between text-[11px]">
                <span className="text-[#706b7b] dark:text-[#a9a2b8]">
                  {item.name} ({item.percentage}%)
                </span>
                <b className="text-[#292431] dark:text-white">{formatBaniToLei(item.amountBani)}</b>
              </div>
            ))}
        </div>
      </div>
    )
  }

  if (result.kind === 'number_explained') {
    return (
      <div className="mt-3 rounded-xl border border-[#dfd8ef] bg-[#faf8ff] p-3.5 text-xs dark:border-[#342e45] dark:bg-[#191622]">
        <div className="flex items-center gap-1.5 border-b border-[#e7e1f5] pb-2 font-semibold uppercase tracking-wider text-[#6b57bd] dark:border-[#2e283d]">
          <Calculator size={13} /> De unde vine: {result.targetNumberLabel}
        </div>
        <div className="mt-2 space-y-1.5 text-[11px]">
          {result.steps.map((step, idx) => (
            <div
              key={idx}
              className={`flex justify-between ${
                idx === result.steps.length - 1
                  ? 'border-t border-[#e7e1f5] pt-1.5 font-semibold text-[#33256c] dark:border-[#2e283d] dark:text-[#d7cfff]'
                  : ''
              }`}
            >
              <span className="text-[#706b7b] dark:text-[#a9a2b8]">{step.label}</span>
              <b>{step.value}</b>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return null
}

export function AgentScreen() {
  const [ctx, setCtx] = useState<UserFinancialContext>(() =>
    typeof window !== 'undefined' ? loadUserFinancialContext() : DEFAULT_USER_CONTEXT
  )
  const [showCustomize, setShowCustomize] = useState(false)
  const [investConfirmed, setInvestConfirmed] = useState('')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const msgCounterRef = useRef(1)

  const liveRoundUpState = executeUpdateRoundUpRule(ctx.roundUpRule, ctx)

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Am analizat luna ta. Ai strâns **209,00 lei** (74,00 lei din rotunjiri + 135,00 lei din salariu).\n\nPoți folosi două tipuri de comenzi:\n1. **Simulare („Ce-ar fi dacă...”):** ex. *„Ce-ar fi dacă rotunjesc la 10 lei?”* — îți arată comparația fără să îți modifice contul.\n2. **Setare activă („Setează...”):** ex. *„Setează rotunjirea la 10 lei”* — aplică regula în contul tău!',
      sources: [
        {
          content: 'Indicele BET și ETF-uri listate la Bursa de Valori București',
          sourceTitle: 'BVB',
          sourceUrl: 'https://www.bvb.ro',
        },
        {
          content: 'Ghidul Pensiilor Private Pilonul II & III',
          sourceTitle: 'ASF',
          sourceUrl: 'https://asfromania.ro',
        },
      ],
    },
  ])

  async function sendToAgent(
    userMessage: string,
    explicitAction?: {
      type: 'update_roundup' | 'simulate_roundup' | 'change_risk' | 'what_if'
      roundUpRule?: RoundUpRule
      riskLevel?: RiskLevel
      extraMonthlyBani?: number
    }
  ) {
    if (!userMessage.trim() || loading) return

    // Find the last toolResult from previous messages so follow-up questions about numbers work!
    const lastToolResult = [...messages]
      .reverse()
      .find((m) => m.role === 'assistant' && m.toolResult)?.toolResult

    const history = messages.slice(-6).map((m) => ({
      role: m.role,
      content: m.content,
    }))

    msgCounterRef.current += 1
    const userMsg: ChatMessage = {
      id: `user-${msgCounterRef.current}`,
      role: 'user',
      content: userMessage.trim(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.trim(),
          context: ctx,
          history,
          lastToolResult,
          explicitAction,
        }),
      })

      if (!res.ok) {
        throw new Error('Request failed')
      }

      const data = (await res.json()) as AgentRunOutput

      if (data.updatedContext) {
        setCtx(data.updatedContext)
        saveUserFinancialContext(data.updatedContext)

        const rawStepLei = Math.round((data.updatedContext.roundUpRule.stepBani ?? 500) / 100)
        const syncedStepLei: 0 | 1 | 5 | 10 =
          rawStepLei >= 10 ? 10 : rawStepLei >= 5 ? 5 : rawStepLei >= 1 ? 1 : 5
        const rawMult = data.updatedContext.roundUpRule.multiplier ?? 1
        const syncedMult: 1 | 2 | 3 = rawMult >= 3 ? 3 : rawMult >= 2 ? 2 : 1

        updateAppState({
          risk: data.updatedContext.riskLevel,
          roundUpStepLei: syncedStepLei,
          roundUpMultiplier: syncedMult,
        })
      }

      msgCounterRef.current += 1
      const assistantMsg: ChatMessage = {
        id: `assistant-${msgCounterRef.current}`,
        role: 'assistant',
        content: data.reply,
        provider: data.provider,
        toolResult: data.toolResult,
        sources: data.sources,
      }

      setMessages((prev) => [...prev, assistantMsg])
    } catch {
      msgCounterRef.current += 1
      const errId = `err-${msgCounterRef.current}`
      setMessages((prev) => [
        ...prev,
        {
          id: errId,
          role: 'assistant',
          content:
            'A apărut o eroare temporară de conexiune. Încearcă din nou într-o secundă.',
        },
      ])
    } finally {
      setLoading(false)
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 80)
    }
  }

  function handleFormSubmit(e: FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    void sendToAgent(input)
  }

  function applyQuickRuleChange(rule: RoundUpRule, label: string) {
    void sendToAgent(label, {
      type: 'update_roundup',
      roundUpRule: rule,
    })
  }

  function applyQuickRiskChange(risk: RiskLevel, label: string) {
    void sendToAgent(label, {
      type: 'change_risk',
      riskLevel: risk,
    })
  }

  const productColors: Record<string, string> = {
    pillar3: 'bg-[#6f5cc1]',
    etfBet: 'bg-[#dca878]',
    govBonds: 'bg-[#438565]',
  }

  return (
    <div>
      <Header title="Agentul tău" subtitle="ÎN FIECARE LUNĂ, ÎMPREUNĂ" />

      <div className="flex flex-col gap-4">
        {/* Live Proposal Card (reacts in real time to committed AI agent changes) */}
        <Card className="border-[#ddd4fa] bg-[#faf8ff] dark:border-[#342e45] dark:bg-[#211d2b]">
          <div className="mb-4 flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.14em] text-[#8c7ad9]">
                Setarea ta activă acum
              </p>
              <p className="mt-1 text-sm font-medium text-[#292431] dark:text-[#f8f6fb]">
                Profil {describeRiskLevelRo(ctx.riskLevel)}
              </p>
              <span className="mt-1.5 inline-block rounded-full bg-[#ede8fb] px-2.5 py-0.5 text-[11px] font-medium text-[#5844b0] dark:bg-[#2e2644] dark:text-[#d7cfff]">
                {liveRoundUpState.ruleLabelRo}
              </span>
            </div>
            <Sparkles className="shrink-0 text-[#8c7ad9]" size={19} />
          </div>

          {/* Dynamic Product Allocation Bars from lib/rules */}
          <div className="flex flex-col gap-3">
            {liveRoundUpState.allocation.breakdown
              .filter((p) => p.amountBani > 0)
              .map((product) => (
                <div key={product.productId} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#4a4458] dark:text-[#dcd6e8]">
                      {product.name}{' '}
                      <span className="text-xs text-[#8c8496]">({product.percentage}%)</span>
                    </span>
                    <b>{formatBaniToLei(product.amountBani)}</b>
                  </div>
                  <div className="h-2 rounded-full bg-[#e8e3f7] dark:bg-[#322b42]">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        productColors[product.productId] ?? 'bg-[#6f5cc1]'
                      }`}
                      style={{ width: `${product.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>

          {/* Live Transaction Round-Up Preview */}
          <div className="mt-4 rounded-xl bg-white/80 p-3 dark:bg-[#18151f]/70">
            <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#8c8496]">
              <span>Plăți cu regula ta activă</span>
              <span>Pușculiță: {liveRoundUpState.estimatedMonthlyRoundUpsFormatted}/lună</span>
            </div>
            <div className="space-y-1.5">
              {liveRoundUpState.sampleTransactions.slice(0, 3).map((tx) => (
                <div
                  key={tx.label}
                  className="flex items-center justify-between text-xs text-[#655d72] dark:text-[#c7c0d4]"
                >
                  <span>
                    {tx.label} ({tx.spentFormatted})
                  </span>
                  <span className="font-semibold text-[#307052]">
                    {tx.roundUpFormatted}{' '}
                    <span className="text-[11px] font-normal text-[#8c8496]">
                      (total {tx.totalToPayFormatted})
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-[#e7e1f5] pt-3.5 dark:border-[#322b42]">
            <span className="text-sm font-semibold text-[#438565]">
              +{liveRoundUpState.monthlyDaysAdded.base} zile de libertate/lună
              <span className="ml-1 text-xs font-normal text-[#8c8496]">
                ({liveRoundUpState.monthlyDaysAdded.pessimistic}–
                {liveRoundUpState.monthlyDaysAdded.optimistic})
              </span>
            </span>
            <span className="text-xs font-semibold text-[#292431] dark:text-[#f8f6fb]">
              {liveRoundUpState.newMonthlyTotalFormatted} total
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() =>
                setInvestConfirmed(
                  `Investiția de ${liveRoundUpState.newMonthlyTotalFormatted} (${liveRoundUpState.allocation.summaryRo}) a fost programată pentru finalul lunii.`
                )
              }
              className="rounded-xl bg-[#33256c] px-3 py-3 text-xs font-semibold text-white transition hover:bg-[#43328a]"
            >
              Da, investește
            </button>
            <button
              type="button"
              onClick={() => setShowCustomize((prev) => !prev)}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-[#dfd8ef] bg-white px-3 py-3 text-xs font-semibold text-[#6b57bd] transition hover:bg-[#f4f1fc] dark:border-[#342e45] dark:bg-[#18151f]"
            >
              <SlidersHorizontal size={14} />
              {showCustomize ? 'Închide opțiunile' : 'Schimbă'}
            </button>
          </div>

          {/* Interactive Customization Drawer inside Proposal Card */}
          {showCustomize && (
            <div className="mt-4 space-y-3 border-t border-[#e7e1f5] pt-3.5 text-xs dark:border-[#322b42]">
              <div>
                <p className="mb-1.5 font-semibold text-[#655d72] dark:text-[#c7c0d4]">
                  1. Aplică o regulă de rotunjire (Round-Up):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Pas 5 lei (Standard)', rule: { stepBani: 500, multiplier: 1 } },
                    { label: 'Pas 10 lei', rule: { stepBani: 1000, multiplier: 1 } },
                    { label: 'Pas 5 lei × 2x', rule: { stepBani: 500, multiplier: 2 } },
                    { label: '+10% la plată', rule: { percentage: 10 as const, roundTo: 'lei' as const } },
                    { label: '+20% la plată', rule: { percentage: 20 as const, roundTo: 'lei' as const } },
                    { label: '+30% la plată', rule: { percentage: 30 as const, roundTo: 'lei' as const } },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() =>
                        applyQuickRuleChange(
                          opt.rule,
                          `Setează regula de rotunjire: ${opt.label}`
                        )
                      }
                      className="rounded-lg border border-[#dfd8ef] bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#33256c] transition hover:bg-[#ede8fb] dark:border-[#342e45] dark:bg-[#18151f] dark:text-[#d7cfff]"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-1.5 font-semibold text-[#655d72] dark:text-[#c7c0d4]">
                  2. Aplică profilul de risc & alocarea:
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      { id: 'low', label: 'Scăzut · Titluri' },
                      { id: 'medium', label: 'Mediu · Echilibrat' },
                      { id: 'high', label: 'Ridicat · BVB' },
                    ] as const
                  ).map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() =>
                        applyQuickRiskChange(
                          r.id,
                          `Setează profilul de risc ${r.label}`
                        )
                      }
                      className={`rounded-lg border px-2 py-1.5 text-[11px] font-medium transition ${
                        ctx.riskLevel === r.id
                          ? 'border-[#33256c] bg-[#33256c] text-white'
                          : 'border-[#dfd8ef] bg-white text-[#655d72] hover:bg-[#ede8fb] dark:border-[#342e45] dark:bg-[#18151f] dark:text-[#c7c0d4]'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>

        {investConfirmed && (
          <div className="flex items-center gap-2 rounded-2xl bg-[#e4f5eb] p-3 text-xs font-medium text-[#307052]">
            <Check size={16} className="shrink-0" />
            <span>{investConfirmed}</span>
          </div>
        )}

        {/* Chat Conversation Thread */}
        <div className="flex flex-col gap-3.5">
          {messages.map((msg) =>
            msg.role === 'assistant' ? (
              <div key={msg.id} className="flex items-start gap-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#33256c] text-white">
                  <Bot size={16} />
                </div>
                <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-white p-4 text-sm leading-6 shadow-xs dark:bg-[#211d2b]">
                  {msg.provider && (
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          msg.provider === 'gemini' || msg.provider === 'groq'
                            ? 'bg-[#e4f5eb] text-[#307052]'
                            : 'bg-[#f1effa] text-[#6b57bd]'
                        }`}
                      >
                        {msg.provider === 'gemini'
                          ? '✨ Gemini AI + lib/rules'
                          : msg.provider === 'groq'
                            ? '✨ Groq AI + lib/rules'
                            : '⚡ Calcul determinist'}
                      </span>
                    </div>
                  )}
                  <div className="text-[#292431] dark:text-[#f8f6fb]">
                    {renderFormattedText(msg.content)}
                  </div>

                  {/* Render deterministic Tool Result Card if returned */}
                  {msg.toolResult && (
                    <ToolResultCard
                      result={msg.toolResult}
                      onApplyRule={applyQuickRuleChange}
                    />
                  )}

                  {/* Render Official Romanian Source Citations */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {msg.sources.map((src, i) => (
                        <a
                          key={`${src.sourceTitle}-${i}`}
                          href={src.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full bg-[#f1effa] px-2.5 py-1 text-[10px] font-medium text-[#6b57bd] transition hover:bg-[#e3ddf7] dark:bg-[#2c253d] dark:text-[#d7cfff]"
                        >
                          <span>{src.sourceTitle}</span>
                          <ExternalLink size={10} />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div key={msg.id} className="flex items-start justify-end gap-2.5">
                <div className="max-w-[82%] rounded-2xl rounded-tr-sm bg-[#33256c] px-4 py-3 text-sm leading-6 text-white shadow-xs">
                  {msg.content}
                </div>
                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#e8e3f7] text-[#33256c]">
                  <User size={15} />
                </div>
              </div>
            )
          )}

          {loading && (
            <div className="flex items-center gap-2.5 text-xs text-[#8c8496]">
              <div className="flex size-8 items-center justify-center rounded-xl bg-[#33256c] text-white">
                <RefreshCw size={14} className="animate-spin" />
              </div>
              <span>Agentul calculează scenariul...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Quick Question & Action Chips */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {QUICK_PROMPTS.map((q) => (
            <button
              key={q}
              type="button"
              disabled={loading}
              onClick={() => void sendToAgent(q)}
              className="inline-flex items-center gap-1 rounded-full border border-[#dfd8ef] bg-white px-3 py-1.5 text-xs font-medium text-[#655d72] transition hover:border-[#8c7ad9] hover:text-[#33256c] disabled:opacity-50 dark:border-[#342e45] dark:bg-[#211d2b] dark:text-[#d7cfff]"
            >
              <span>{q}</span>
              <ArrowRight size={11} className="opacity-60" />
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <form
          onSubmit={handleFormSubmit}
          className="mt-2 flex items-center gap-2 rounded-2xl border border-black/[.08] bg-white p-2 shadow-xs dark:border-white/[.1] dark:bg-[#211d2b]"
        >
          <input
            aria-label="Message agent"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Ex: „Ce-ar fi dacă rotunjesc la 10 lei?” sau „Setează la 10 lei”"
            className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-[#9a94a3]"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#33256c] text-white transition hover:bg-[#43328a] disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </form>

        <p className="text-center text-[11px] text-[#9a94a3]">
          Cifrele sunt calculate determinist (lib/rules). Agentul oferă educație financiară, nu consultanță.
        </p>
      </div>
    </div>
  )
}
