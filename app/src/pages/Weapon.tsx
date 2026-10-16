import { useMemo } from 'react'
import PageHeader from '../components/PageHeader'
import NumberInput from '../components/NumberInput'
import SynthButtons from '../components/SynthButtons'
import RunsLineChart, {
  type Marker,
  type RunsSeries,
} from '../components/RunsLineChart'
import { useLocalStorage } from '../lib/useLocalStorage'
import {
  WEAPON_BREAK_COSTS,
  WEAPON_BREAK_MAX,
  WEAPON_BREAK_MIN,
  weaponBreakCost,
  type WeaponMatRarity,
  type WeaponQuality,
} from '../lib/materials'
import {
  MAX_RUNS_LIMIT,
  weaponSufficiencyByRuns,
} from '../lib/sufficiencyByRuns'
import { canSynth, lowerRarity, synthesize } from '../lib/synthesis'

type State = {
  quality: WeaponQuality
  from: number
  owned: Record<WeaponMatRarity, number>
  maxRuns: number
}

const INITIAL: State = {
  quality: 5,
  from: 0,
  owned: { 2: 0, 3: 0, 4: 0, 5: 0 },
  maxRuns: 10,
}

const MAX_RUNS_MIN = 1

const RARITIES: WeaponMatRarity[] = [5, 4, 3, 2]
const STAR = (r: WeaponMatRarity) => `★${r}`
const QUALITIES: WeaponQuality[] = [3, 4, 5]
const LOWEST_RARITY: WeaponMatRarity = 2

const nextBreakCost = (s: State) =>
  s.from < WEAPON_BREAK_MAX ? WEAPON_BREAK_COSTS[s.quality][s.from + 1] : null

const canEnhance = (s: State) => {
  const c = nextBreakCost(s)
  return c != null && s.owned[c.rarity] >= c.count
}

// 目標突破数ごとに固定の系列スタイル。色相を 60° 間隔で色相環順に並べ、
// 暗い背景で読めるよう色相ごとに彩度・明度を調整している
const TARGET_STYLES: Record<number, { color: string; marker: Marker }> = {
  1: { color: 'hsl(0 85% 65%)', marker: 'circle' },
  2: { color: 'hsl(60 80% 55%)', marker: 'square' },
  3: { color: 'hsl(120 65% 55%)', marker: 'triangle' },
  4: { color: 'hsl(180 70% 50%)', marker: 'diamond' },
  5: { color: 'hsl(240 90% 74%)', marker: 'triangleDown' },
  6: { color: 'hsl(300 80% 70%)', marker: 'cross' },
}

export default function Weapon() {
  const [state, setState, reset] = useLocalStorage<State>(
    'weapon2-v2',
    INITIAL
  )

  const series = useMemo(() => {
    const result: RunsSeries[] = []
    for (let t = state.from + 1; t <= WEAPON_BREAK_MAX; t++) {
      const totals = weaponBreakCost(state.quality, state.from, t)
      result.push({
        label: `突破${t}`,
        values: weaponSufficiencyByRuns(state.owned, totals, state.maxRuns),
        color: TARGET_STYLES[t].color,
        marker: TARGET_STYLES[t].marker,
      })
    }
    return result
  }, [state.quality, state.from, state.owned, state.maxRuns])

  const setOwned = (r: WeaponMatRarity, v: number) => {
    setState((s) => ({
      ...s,
      owned: { ...s.owned, [r]: Math.max(0, Math.floor(v)) },
    }))
  }

  const setFrom = (v: number) => {
    const clamped = Math.max(
      WEAPON_BREAK_MIN,
      Math.min(WEAPON_BREAK_MAX, Math.floor(v))
    )
    setState((s) => ({ ...s, from: clamped }))
  }

  const enhance = () => {
    setState((s) => {
      const c = nextBreakCost(s)
      if (c == null || !canEnhance(s)) return s
      return {
        ...s,
        from: s.from + 1,
        owned: { ...s.owned, [c.rarity]: s.owned[c.rarity] - c.count },
      }
    })
  }

  const synth = (r: WeaponMatRarity, n: number) => {
    setState((s) => {
      const owned = synthesize(s.owned, r, n, LOWEST_RARITY)
      return owned == null ? s : { ...s, owned }
    })
  }

  const setMaxRuns = (v: number) => {
    const clamped = Math.max(
      MAX_RUNS_MIN,
      Math.min(MAX_RUNS_LIMIT, Math.floor(v))
    )
    setState((s) => ({ ...s, maxRuns: clamped }))
  }

  return (
    <div>
      <PageHeader
        title="武器突破素材"
        actions={
          <button className="btn-danger" onClick={reset}>
            初期値に戻す
          </button>
        }
      />

      <div className="grid gap-4">
        <div className="card p-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3">
              <label className="label w-20 shrink-0" htmlFor="quality">
                クオリティ
              </label>
              <select
                id="quality"
                className="input"
                value={state.quality}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    quality: Number(e.target.value) as WeaponQuality,
                  }))
                }
              >
                {QUALITIES.map((q) => (
                  <option key={q} value={q}>
                    ★{q} 武器
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <label className="label w-20 shrink-0" htmlFor="from">
                現在突破
              </label>
              <NumberInput
                id="from"
                value={state.from}
                min={WEAPON_BREAK_MIN}
                max={WEAPON_BREAK_MAX}
                onChange={setFrom}
              />
              <button
                type="button"
                className="btn shrink-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/[0.04]"
                onClick={enhance}
                disabled={!canEnhance(state)}
              >
                強化
              </button>
            </div>
            <div className="flex items-center gap-3">
              <label className="label w-20 shrink-0" htmlFor="maxRuns">
                周回数上限
              </label>
              <NumberInput
                id="maxRuns"
                value={state.maxRuns}
                min={MAX_RUNS_MIN}
                max={MAX_RUNS_LIMIT}
                onChange={setMaxRuns}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="table-mini">
              <thead>
                <tr>
                  <th className="w-20"></th>
                  {RARITIES.map((r) => (
                    <th key={r} className="w-28 text-right">
                      {STAR(r)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="text-neutral-400">所持</td>
                  {RARITIES.map((r) => (
                    <td key={r}>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          tabIndex={-1}
                          className="w-6 h-6 shrink-0 flex items-center justify-center rounded bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 text-xs"
                          onClick={() => setOwned(r, state.owned[r] - 1)}
                          aria-label={`${STAR(r)}を減らす`}
                        >
                          −
                        </button>
                        <NumberInput
                          value={state.owned[r]}
                          min={0}
                          onChange={(v) => setOwned(r, v)}
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          className="w-6 h-6 shrink-0 flex items-center justify-center rounded bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 text-xs"
                          onClick={() => setOwned(r, state.owned[r] + 1)}
                          aria-label={`${STAR(r)}を増やす`}
                        >
                          ＋
                        </button>
                        {lowerRarity(r, LOWEST_RARITY) != null && (
                          <SynthButtons
                            disabled={!canSynth(state.owned, r, LOWEST_RARITY)}
                            onSynth={(n) => synth(r, n)}
                          />
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {series.length > 0 && (
          <div className="card p-4">
            <RunsLineChart series={series} />
          </div>
        )}
      </div>
    </div>
  )
}
