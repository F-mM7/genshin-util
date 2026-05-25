import NumberInput from '../NumberInput'
import { SUBSTAT_LABELS } from '../../lib/artifact/constants'
import { CALCULATION_CONSTANTS } from '../../lib/artifact/constants'
import {
  calculateSubstatValue,
  display,
} from '../../lib/artifact/calc'
import type {
  SubstatType,
  SubstatValues,
} from '../../lib/artifact/types'

type Props = {
  level: number
  exp: number
  maxLevel: number
  selectedSubstats: SubstatType[]
  substatValues: SubstatValues
  onLevelChange: (next: number) => void
  onExpChange: (next: number) => void
  onSubstatValueChange: (substat: SubstatType, value: number) => void
  onReset: () => void
}

export default function ArtifactEnhancer({
  level,
  exp,
  maxLevel,
  selectedSubstats,
  substatValues,
  onLevelChange,
  onExpChange,
  onSubstatValueChange,
  onReset,
}: Props) {
  const adjust = (substat: SubstatType, dir: 1 | -1) => {
    const current = substatValues[substat] ?? 0
    const max = calculateSubstatValue(
      substat,
      CALCULATION_CONSTANTS.MAX_ENHANCEMENTS
    )
    const delta =
      calculateSubstatValue(substat, CALCULATION_CONSTANTS.LOW_ROLL_MULTIPLIER) *
      dir
    const next = Math.max(0, Math.min(max, current + delta))
    onSubstatValueChange(substat, parseFloat(display(next)))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-semibold">現在の聖遺物</h2>
        <button className="btn-danger" onClick={onReset}>
          Lv/Exp をリセット
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <label htmlFor="art-level" className="label w-16 shrink-0">
            Lv
          </label>
          <NumberInput
            id="art-level"
            value={level}
            min={0}
            max={maxLevel}
            onChange={(v) => onLevelChange(Math.max(0, Math.min(maxLevel, v)))}
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="art-exp" className="label w-16 shrink-0">
            Exp
          </label>
          <NumberInput
            id="art-exp"
            value={exp}
            min={0}
            onChange={(v) => onExpChange(Math.max(0, v))}
          />
        </div>
      </div>
      {selectedSubstats.length === 0 ? null : (
        <div className="space-y-2">
          {selectedSubstats.map((s) => {
            const value = substatValues[s] ?? 0
            const max = calculateSubstatValue(
              s,
              CALCULATION_CONSTANTS.MAX_ENHANCEMENTS
            )
            return (
              <div key={s} className="flex items-center gap-2">
                <label className="label w-32 shrink-0">{SUBSTAT_LABELS[s]}</label>
                <div className="w-28">
                  <NumberInput
                    value={value}
                    min={0}
                    max={parseFloat(display(max))}
                    step={0.1}
                    onChange={(v) => onSubstatValueChange(s, v)}
                  />
                </div>
                <button
                  type="button"
                  className="btn px-2"
                  onClick={() => adjust(s, -1)}
                  aria-label={`${SUBSTAT_LABELS[s]}を1ロール減らす`}
                >
                  −
                </button>
                <button
                  type="button"
                  className="btn px-2"
                  onClick={() => adjust(s, 1)}
                  aria-label={`${SUBSTAT_LABELS[s]}を1ロール増やす`}
                >
                  ＋
                </button>
                <span className="text-xs text-slate-500">
                  / {display(max)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
