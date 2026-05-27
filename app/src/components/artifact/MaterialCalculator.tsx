import {
  ENHANCE_FACTORS,
  MATERIALS,
  MATERIAL_ORDER,
} from '../../lib/artifact/constants'
import type { StepEnd } from '../../lib/artifact/calc'
import { fmt } from '../../lib/format'
import type {
  MaterialToggleState,
  MaterialType,
  MaterialUsage,
  TargetLevel,
} from '../../lib/artifact/types'

const TARGET_LEVELS: TargetLevel[] = ['auto', 4, 8, 12, 16, 20]
const CAP_DIVISORS = [1, 2, 5] as const

const stepExp = (u: MaterialUsage) =>
  MATERIAL_ORDER.reduce((sum, m) => sum + u[m] * MATERIALS[m], 0)

type Props = {
  expReq: number
  expCap: number
  givenExp: number
  materialUsage: MaterialUsage
  currentStepEnd: StepEnd
  futureMaterialUsages: MaterialUsage[]
  futureStepEnds: StepEnd[]
  enabledMaterials: MaterialToggleState
  capDivisor: number
  targetLevel: TargetLevel
  maxLevel: number
  onMaterialToggle: (m: MaterialType) => void
  onExpGain: (multiplier: number) => void
  onCapDivisorChange: (next: number) => void
  onTargetLevelChange: (next: TargetLevel) => void
}

export default function MaterialCalculator({
  expReq,
  expCap,
  givenExp,
  materialUsage,
  currentStepEnd,
  futureMaterialUsages,
  futureStepEnds,
  enabledMaterials,
  capDivisor,
  targetLevel,
  maxLevel,
  onMaterialToggle,
  onExpGain,
  onCapDivisorChange,
  onTargetLevelChange,
}: Props) {
  const stepEnds: StepEnd[] = [currentStepEnd, ...futureStepEnds]
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center flex-wrap gap-2">
          <span className="label w-24 shrink-0">目標レベル</span>
          <div className="flex flex-wrap gap-1">
            {TARGET_LEVELS.map((lv) => {
              const disabled = typeof lv === 'number' && lv > maxLevel
              const active = targetLevel === lv
              return (
                <button
                  key={lv}
                  type="button"
                  disabled={disabled}
                  className={`btn ${
                    active
                      ? 'bg-sky-900/40 border-sky-600 text-sky-100'
                      : disabled
                        ? 'opacity-40 cursor-not-allowed'
                        : ''
                  }`}
                  onClick={() => onTargetLevelChange(lv)}
                >
                  {lv === 'auto' ? '自動' : lv}
                </button>
              )
            })}
          </div>
        </div>
        <div className="flex items-center flex-wrap gap-2">
          <span className="label w-24 shrink-0">cap divisor</span>
          <div className="flex gap-1">
            {CAP_DIVISORS.map((d) => (
              <button
                key={d}
                type="button"
                className={`btn ${
                  capDivisor === d
                    ? 'bg-sky-900/40 border-sky-600 text-sky-100'
                    : ''
                }`}
                onClick={() => onCapDivisorChange(d)}
              >
                ÷{d}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-slate-900/60 border border-slate-800 rounded p-2">
          <div className="label text-xs">必要 Exp</div>
          <div className="stat">{fmt(expReq)}</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded p-2">
          <div className="label text-xs">投入上限 Exp</div>
          <div className="stat">{fmt(expCap, 1)}</div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="table-mini table-fixed !w-fit">
          <colgroup>
            <col className="w-20" />
            {stepEnds.map((_, i) => (
              <col key={i} className="w-20" />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th className="text-left">素材</th>
              {stepEnds.map((s, i) => (
                <th
                  key={i}
                  className={`text-right whitespace-nowrap ${
                    i === 0 ? '' : 'text-slate-500'
                  }`}
                >
                  <div className="text-xs">
                    {i === 0 ? '今回' : `+${i}`}
                  </div>
                  <div className="font-normal text-[10px]">
                    Lv{s.level} / {fmt(s.exp)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MATERIAL_ORDER.map((m) => {
              const active = enabledMaterials[m]
              return (
                <tr key={m}>
                  <td>
                    <button
                      type="button"
                      className={`btn w-full justify-center text-xs ${
                        active
                          ? 'bg-sky-900/40 border-sky-600 text-sky-100'
                          : 'opacity-60'
                      }`}
                      onClick={() => onMaterialToggle(m)}
                    >
                      {m}
                    </button>
                  </td>
                  <td className="text-right stat">
                    {materialUsage[m] || ''}
                  </td>
                  {futureMaterialUsages.map((u, i) => (
                    <td key={i} className="text-right stat text-slate-500">
                      {u[m] || ''}
                    </td>
                  ))}
                </tr>
              )
            })}
            <tr className="border-t border-slate-700">
              <td className="label text-xs text-center">投入exp</td>
              <td className="text-right stat">
                {givenExp ? fmt(givenExp) : ''}
              </td>
              {futureMaterialUsages.map((u, i) => {
                const e = stepExp(u)
                return (
                  <td key={i} className="text-right stat text-slate-500">
                    {e ? fmt(e) : ''}
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="label w-24 shrink-0">投入 Exp</span>
        <div className="stat text-lg">{fmt(givenExp)}</div>
        <div className="flex gap-1 ml-auto">
          {ENHANCE_FACTORS.map((factor) => (
            <button
              key={factor}
              type="button"
              className="btn"
              disabled={givenExp <= 0}
              onClick={() => onExpGain(factor)}
            >
              ×{factor} 投入
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
