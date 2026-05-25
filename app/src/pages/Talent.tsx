import { useMemo } from 'react'
import PageHeader from '../components/PageHeader'
import NumberInput from '../components/NumberInput'
import ScenarioRows from '../components/ScenarioRows'
import { useLocalStorage } from '../lib/useLocalStorage'
import { fmt } from '../lib/format'
import {
  TALENT_MAX,
  TALENT_MIN,
  talentCost,
  type TalentRarity,
} from '../lib/materials'
import { binomialPMF } from '../lib/probability'

type Row = {
  id: string
  from: number
  to: number
  count: number
}

type State = {
  rows: Row[]
  owned: Record<TalentRarity, number>
}

const INITIAL: State = {
  rows: [
    { id: 'a', from: 1, to: 10, count: 1 },
    { id: 'b', from: 10, to: 10, count: 0 },
    { id: 'c', from: 1, to: 1, count: 0 },
  ],
  owned: { 2: 14, 3: 33, 4: 22 },
}

const RARITIES: TalentRarity[] = [4, 3, 2]
const STAR = (r: TalentRarity) => `★${r}`

export default function Talent() {
  const [state, setState, reset] = useLocalStorage<State>('talent-v3', INITIAL)

  const totals = useMemo(() => {
    const acc: Record<TalentRarity, number> = { 2: 0, 3: 0, 4: 0 }
    for (const row of state.rows) {
      const cost = talentCost(row.from, row.to, row.count)
      for (const r of RARITIES) acc[r] += cost[r]
    }
    return acc
  }, [state.rows])

  // 繰上シナリオの計算:
  //   - 「最低（×1）」: ★N余り÷3 ×1 を ★(N+1) へ流す（連鎖、floor）
  //   - 「最高（×2）」: ★N余り÷3 ×2 を ★(N+1) へ流す（連鎖、floor）
  //   - 「期待値」: 充足確率と同じ分布（K~Bin(n,0.1)）に基づく厳密な期待値。
  //       ★3 繰上獲得 = n3 * 1.1
  //       ★4 繰上獲得 = 1.1 * Σ_{k3} pmf3[k3] * n4(k3)
  const carry = useMemo(() => {
    const chainInt = (factor: number) => {
      const gain: Record<TalentRarity, number> = { 2: 0, 3: 0, 4: 0 }
      const surplus: Record<TalentRarity, number> = { 2: 0, 3: 0, 4: 0 }
      surplus[2] = state.owned[2] - totals[2]
      gain[3] = Math.max(0, Math.floor(surplus[2] / 3)) * factor
      surplus[3] = state.owned[3] + gain[3] - totals[3]
      gain[4] = Math.max(0, Math.floor(surplus[3] / 3)) * factor
      surplus[4] = state.owned[4] + gain[4] - totals[4]
      return { gain, surplus }
    }

    const surplus2 = state.owned[2] - totals[2]
    const n3 = Math.max(0, Math.floor(surplus2 / 3))
    const expGain3 = n3 * 1.1
    const pmf3 = binomialPMF(n3, 0.1)
    let expN4 = 0
    for (let k3 = 0; k3 <= n3; k3++) {
      const s3 = state.owned[3] + n3 + k3 - totals[3]
      const n4 = Math.max(0, Math.floor(s3 / 3))
      expN4 += pmf3[k3] * n4
    }
    const expGain4 = expN4 * 1.1

    const gainExp: Record<TalentRarity, number> = {
      2: 0,
      3: expGain3,
      4: expGain4,
    }
    const expectSurplus: Record<TalentRarity, number> = {
      2: surplus2,
      3: state.owned[3] + expGain3 - totals[3],
      4: state.owned[4] + expGain4 - totals[4],
    }

    return {
      boss: chainInt(2),
      normal: chainInt(1),
      expect: { gain: gainExp, surplus: expectSurplus },
    }
  }, [state.owned, totals])

  // トータル充足確率（厳密計算）
  //   繰上1回のドロップ: 90% で +1個, 10% で +2個。
  //   n 回ぶんの合計を G とすると、+2個になった回数 K ~ Binomial(n, 0.1) で G = n + K。
  //   ★2 が不足なら 0。それ以外は K3 の各実現で
  //     ★3 充足 (s3 ≥ 0) かつ ★4 充足 (owned[4] + n4 + K4 ≥ totals[4])
  //   となる確率を K3 周辺化で合算する。
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
      const k4Need = Math.max(0, Math.ceil(totals[4] - state.owned[4] - n4))
      if (k4Need > n4) continue

      const pmf4 = binomialPMF(n4, 0.1)
      let pSuf4 = 0
      for (let k4 = k4Need; k4 <= n4; k4++) {
        pSuf4 += pmf4[k4]
      }
      total += pmf3[k3] * pSuf4
    }

    return total
  }, [state.owned, totals])

  const updateRow = (id: string, patch: Partial<Row>) => {
    setState((s) => ({
      ...s,
      rows: s.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }))
  }

  const setOwned = (r: TalentRarity, v: number) => {
    setState((s) => ({
      ...s,
      owned: { ...s.owned, [r]: Math.max(0, Math.floor(v)) },
    }))
  }

  const addRow = () => {
    setState((s) => ({
      ...s,
      rows: [
        ...s.rows,
        {
          id: Math.random().toString(36).slice(2, 8),
          from: 1,
          to: 1,
          count: 0,
        },
      ],
    }))
  }

  const removeRow = (id: string) => {
    setState((s) => ({ ...s, rows: s.rows.filter((r) => r.id !== id) }))
  }

  return (
    <div>
      <PageHeader
        title="天賦素材"
        actions={
          <button className="btn-danger" onClick={reset}>
            初期値に戻す
          </button>
        }
      />

      <div className="grid gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">天賦行</h2>
            <button className="btn" onClick={addRow}>
              ＋ 行を追加
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="table-mini">
              <thead>
                <tr>
                  <th className="w-20 text-right">現在</th>
                  <th className="w-20 text-right">目標</th>
                  <th className="w-20 text-right">個数</th>
                  {RARITIES.map((r) => (
                    <th key={r} className="w-28 text-right">
                      {STAR(r)}
                    </th>
                  ))}
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {state.rows.map((row) => {
                  const cost = talentCost(row.from, row.to, row.count)
                  return (
                    <tr key={row.id}>
                      <td>
                        <NumberInput
                          value={row.from}
                          min={TALENT_MIN}
                          max={TALENT_MAX}
                          onChange={(v) => updateRow(row.id, { from: v })}
                        />
                      </td>
                      <td>
                        <NumberInput
                          value={row.to}
                          min={TALENT_MIN}
                          max={TALENT_MAX}
                          onChange={(v) => updateRow(row.id, { to: v })}
                        />
                      </td>
                      <td>
                        <NumberInput
                          value={row.count}
                          min={0}
                          onChange={(v) => updateRow(row.id, { count: v })}
                        />
                      </td>
                      {RARITIES.map((r) => (
                        <td
                          key={r}
                          className="text-right stat text-slate-300"
                        >
                          {fmt(cost[r])}
                        </td>
                      ))}
                      <td className="text-right">
                        <button
                          className="text-slate-500 hover:text-rose-400 text-sm"
                          onClick={() => removeRow(row.id)}
                          aria-label="削除"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  )
                })}
                <tr className="font-semibold">
                  <td colSpan={3} className="text-right">
                    合計
                  </td>
                  {RARITIES.map((r) => (
                    <td key={r} className="text-right stat">
                      {fmt(totals[r])}
                    </td>
                  ))}
                  <td></td>
                </tr>
                <tr>
                  <td colSpan={3} className="text-right text-slate-400">
                    所持
                  </td>
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
                  <td></td>
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

