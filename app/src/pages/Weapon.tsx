import { useMemo } from 'react'
import PageHeader from '../components/PageHeader'
import NumberInput from '../components/NumberInput'
import ScenarioRows from '../components/ScenarioRows'
import { useLocalStorage } from '../lib/useLocalStorage'
import { fmt } from '../lib/format'
import {
  WEAPON_BREAK_MAX,
  WEAPON_BREAK_MIN,
  weaponBreakCost,
  type WeaponMatRarity,
  type WeaponQuality,
} from '../lib/materials'
import { binomialPMF } from '../lib/probability'

type State = {
  quality: WeaponQuality
  from: number
  to: number
  owned: Record<WeaponMatRarity, number>
}

const INITIAL: State = {
  quality: 5,
  from: 0,
  to: 6,
  owned: { 2: 0, 3: 0, 4: 0, 5: 0 },
}

const RARITIES: WeaponMatRarity[] = [5, 4, 3, 2]
const STAR = (r: WeaponMatRarity) => `★${r}`
const QUALITIES: WeaponQuality[] = [3, 4, 5]

export default function Weapon() {
  const [state, setState, reset] = useLocalStorage<State>('weapon-v2', INITIAL)

  const totals = useMemo(
    () => weaponBreakCost(state.quality, state.from, state.to),
    [state.quality, state.from, state.to]
  )

  // 繰上シナリオの計算（Talent と同形式、レアリティを ★2〜★5 に拡張）:
  //   - 「最低（×1）」: ★N余り÷3 ×1 を ★(N+1) へ流す（連鎖、floor）
  //   - 「最高（×2）」: ★N余り÷3 ×2 を ★(N+1) へ流す（連鎖、floor）
  //   - 「期待値」: 充足確率と同じ分布（K~Bin(n,0.1)）に基づく厳密な期待値。
  //       ★3 獲得 = n3 * 1.1
  //       ★4 獲得 = 1.1 * Σ_{k3} pmf3[k3] * n4(k3)
  //       ★5 獲得 = 1.1 * Σ_{k3,k4} pmf3[k3] * pmf4(n4(k3))[k4] * n5(k3,k4)
  const carry = useMemo(() => {
    const chainInt = (factor: number) => {
      const gain: Record<WeaponMatRarity, number> = { 2: 0, 3: 0, 4: 0, 5: 0 }
      const surplus: Record<WeaponMatRarity, number> = {
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      }
      surplus[2] = state.owned[2] - totals[2]
      gain[3] = Math.max(0, Math.floor(surplus[2] / 3)) * factor
      surplus[3] = state.owned[3] + gain[3] - totals[3]
      gain[4] = Math.max(0, Math.floor(surplus[3] / 3)) * factor
      surplus[4] = state.owned[4] + gain[4] - totals[4]
      gain[5] = Math.max(0, Math.floor(surplus[4] / 3)) * factor
      surplus[5] = state.owned[5] + gain[5] - totals[5]
      return { gain, surplus }
    }

    const surplus2 = state.owned[2] - totals[2]
    const n3 = Math.max(0, Math.floor(surplus2 / 3))
    const pmf3 = binomialPMF(n3, 0.1)

    let expN4 = 0
    let expN5 = 0
    for (let k3 = 0; k3 <= n3; k3++) {
      const s3 = state.owned[3] + n3 + k3 - totals[3]
      const n4 = Math.max(0, Math.floor(s3 / 3))
      expN4 += pmf3[k3] * n4

      const pmf4 = binomialPMF(n4, 0.1)
      for (let k4 = 0; k4 <= n4; k4++) {
        const s4 = state.owned[4] + n4 + k4 - totals[4]
        const n5 = Math.max(0, Math.floor(s4 / 3))
        expN5 += pmf3[k3] * pmf4[k4] * n5
      }
    }
    const expGain3 = n3 * 1.1
    const expGain4 = expN4 * 1.1
    const expGain5 = expN5 * 1.1

    const gainExp: Record<WeaponMatRarity, number> = {
      2: 0,
      3: expGain3,
      4: expGain4,
      5: expGain5,
    }
    const expectSurplus: Record<WeaponMatRarity, number> = {
      2: surplus2,
      3: state.owned[3] + expGain3 - totals[3],
      4: state.owned[4] + expGain4 - totals[4],
      5: state.owned[5] + expGain5 - totals[5],
    }

    return {
      boss: chainInt(2),
      normal: chainInt(1),
      expect: { gain: gainExp, surplus: expectSurplus },
    }
  }, [state.owned, totals])

  // トータル充足確率（厳密計算、★2〜★5 同時充足）。
  //   K_r ~ Bin(n_r, 0.1) を仮定。★N 不足が出た時点でその試行は不充足。
  const probability = useMemo(() => {
    const surplus2 = state.owned[2] - totals[2]
    if (surplus2 < 0) return 0

    const n3 = Math.max(0, Math.floor(surplus2 / 3))
    const pmf3 = binomialPMF(n3, 0.1)

    let total = 0
    for (let k3 = 0; k3 <= n3; k3++) {
      const s3 = state.owned[3] + n3 + k3 - totals[3]
      if (s3 < 0) continue
      const n4 = Math.max(0, Math.floor(s3 / 3))
      const pmf4 = binomialPMF(n4, 0.1)

      for (let k4 = 0; k4 <= n4; k4++) {
        const s4 = state.owned[4] + n4 + k4 - totals[4]
        if (s4 < 0) continue
        const n5 = Math.max(0, Math.floor(s4 / 3))
        const k5Need = Math.max(0, Math.ceil(totals[5] - state.owned[5] - n5))
        if (k5Need > n5) continue

        const pmf5 = binomialPMF(n5, 0.1)
        let pSuf5 = 0
        for (let k5 = k5Need; k5 <= n5; k5++) {
          pSuf5 += pmf5[k5]
        }
        total += pmf3[k3] * pmf4[k4] * pSuf5
      }
    }
    return total
  }, [state.owned, totals])

  const setOwned = (r: WeaponMatRarity, v: number) => {
    setState((s) => ({
      ...s,
      owned: { ...s.owned, [r]: Math.max(0, Math.floor(v)) },
    }))
  }

  const setBreak = (key: 'from' | 'to', v: number) => {
    const clamped = Math.max(
      WEAPON_BREAK_MIN,
      Math.min(WEAPON_BREAK_MAX, Math.floor(v))
    )
    setState((s) => ({ ...s, [key]: clamped }))
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
          <div className="grid gap-3 sm:grid-cols-3">
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
                onChange={(v) => setBreak('from', v)}
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="label w-20 shrink-0" htmlFor="to">
                目標突破
              </label>
              <NumberInput
                id="to"
                value={state.to}
                min={WEAPON_BREAK_MIN}
                max={WEAPON_BREAK_MAX}
                onChange={(v) => setBreak('to', v)}
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
                <tr className="font-semibold">
                  <td className="text-slate-400">必要</td>
                  {RARITIES.map((r) => (
                    <td key={r} className="text-right stat">
                      {fmt(totals[r])}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="text-slate-400">所持</td>
                  {RARITIES.map((r) => (
                    <td key={r}>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="w-6 h-6 shrink-0 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs"
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
                          className="w-6 h-6 shrink-0 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs"
                          onClick={() => setOwned(r, state.owned[r] + 1)}
                          aria-label={`${STAR(r)}を増やす`}
                        >
                          ＋
                        </button>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-4 space-y-3">
          <h2 className="font-semibold">結果</h2>
          <div className="overflow-x-auto">
            <table className="table-mini">
              <thead>
                <tr>
                  <th>シナリオ</th>
                  <th></th>
                  {RARITIES.map((r) => (
                    <th key={r} className="text-right">
                      {STAR(r)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <ScenarioRows
                  rarities={RARITIES}
                  title="最低（×1）"
                  gain={carry.normal.gain}
                  surplus={carry.normal.surplus}
                />
                <ScenarioRows
                  rarities={RARITIES}
                  title="最高（×2）"
                  gain={carry.boss.gain}
                  surplus={carry.boss.surplus}
                />
                <ScenarioRows
                  rarities={RARITIES}
                  title="期待値"
                  gain={carry.expect.gain}
                  surplus={carry.expect.surplus}
                  decimals={1}
                />
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-4 space-y-2">
          <h2 className="font-semibold">充足確率</h2>
          <p
            className={`text-3xl stat ${
              probability >= 1 ? 'stat-pos' : 'text-slate-100'
            }`}
          >
            {`${(probability * 100).toFixed(1)}%`}
          </p>
        </div>
      </div>
    </div>
  )
}
