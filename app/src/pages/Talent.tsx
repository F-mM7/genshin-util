import { useMemo } from 'react'
import PageHeader from '../components/PageHeader'
import NumberInput from '../components/NumberInput'
import { useLocalStorage } from '../lib/useLocalStorage'
import { fmt, signClass } from '../lib/format'
import {
  TALENT_MAX,
  TALENT_MIN,
  talentCost,
  type TalentRarity,
} from '../lib/materials'

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

  // Excel に忠実な計算:
  //   - 「週ボス（×2）」: ★N余り÷3 ×2 を ★(N+1) へ流す（連鎖）
  //   - 「通常（×1）」  : ★N余り÷3 ×1 を ★(N+1) へ流す（連鎖）
  //   - 「期待値（×1.1）」: 通常の余りに対して 1.1倍した「期待ドロップ数」を ★(N+1) へ
  //                         加算（端数切捨てなし、Excel E11/F11 と同じ式）
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

    const normal = chainInt(1)
    const gainExp: Record<TalentRarity, number> = {
      2: 0,
      3: Math.max(0, (normal.surplus[2] * 1.1) / 3),
      4: Math.max(0, (normal.surplus[3] * 1.1) / 3),
    }
    const expectSurplus: Record<TalentRarity, number> = {
      2: normal.surplus[2],
      3: state.owned[3] + gainExp[3] - totals[3],
      4: state.owned[4] + gainExp[4] - totals[4],
    }

    return {
      boss: chainInt(2),
      normal,
      expect: { gain: gainExp, surplus: expectSurplus },
    }
  }, [state.owned, totals])

  // 充足確率（モンテカルロシミュレーション）
  //   繰上1回あたり: 90% で +1個, 10% で +2個 を受け取る分布。
  //   ★N の繰上回数は floor(★N 余り / 3) で固定し、ドロップだけを試行する。
  //   ★2 は繰上の起点なので所持 - 必要が0以上なら 100%、不足なら 0%（決定的）。
  const probability = useMemo(() => {
    const trials = 10000
    const surplus2 = state.owned[2] - totals[2]
    const n3 = Math.max(0, Math.floor(surplus2 / 3))
    let count3 = 0
    let count4 = 0

    for (let i = 0; i < trials; i++) {
      let gain3 = 0
      for (let j = 0; j < n3; j++) {
        gain3 += Math.random() < 0.9 ? 1 : 2
      }
      const s3 = state.owned[3] + gain3 - totals[3]
      if (s3 >= 0) count3 += 1

      const n4 = Math.max(0, Math.floor(s3 / 3))
      let gain4 = 0
      for (let j = 0; j < n4; j++) {
        gain4 += Math.random() < 0.9 ? 1 : 2
      }
      const s4 = state.owned[4] + gain4 - totals[4]
      if (s4 >= 0) count4 += 1
    }

    return {
      2: surplus2 >= 0 ? 1 : 0,
      3: count3 / trials,
      4: count4 / trials,
    } as Record<TalentRarity, number>
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

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-4 lg:col-span-2">
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
                  title="最低（×1）"
                  gain={carry.normal.gain}
                  surplus={carry.normal.surplus}
                />
                <ScenarioRows
                  title="最高（×2）"
                  gain={carry.boss.gain}
                  surplus={carry.boss.surplus}
                />
                <ScenarioRows
                  title="期待値（×1.1）"
                  gain={carry.expect.gain}
                  surplus={carry.expect.surplus}
                  probability={probability}
                  decimals={1}
                />
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function ScenarioRows({
  title,
  gain,
  surplus,
  probability,
  decimals = 0,
}: {
  title: string
  gain: Record<TalentRarity, number>
  surplus: Record<TalentRarity, number>
  probability?: Record<TalentRarity, number>
  decimals?: number
}) {
  const rowSpan = probability ? 3 : 2
  return (
    <>
      <tr>
        <td rowSpan={rowSpan} className="font-medium align-top">
          {title}
        </td>
        <td className="text-slate-400">繰上獲得</td>
        {RARITIES.map((r) => (
          <td key={r} className="text-right stat text-slate-300">
            {fmt(gain[r], decimals)}
          </td>
        ))}
      </tr>
      <tr className={probability ? '' : 'border-b border-slate-800'}>
        <td className="text-slate-400">最終余り</td>
        {RARITIES.map((r) => (
          <td
            key={r}
            className={`text-right stat ${signClass(surplus[r])}`}
          >
            {fmt(surplus[r], decimals)}
          </td>
        ))}
      </tr>
      {probability ? (
        <tr className="border-b border-slate-800">
          <td className="text-slate-400">充足確率</td>
          {RARITIES.map((r) => (
            <td
              key={r}
              className={`text-right stat ${
                probability[r] >= 1 ? 'stat-pos' : 'text-slate-300'
              }`}
            >
              {`${(probability[r] * 100).toFixed(1)}%`}
            </td>
          ))}
        </tr>
      ) : null}
    </>
  )
}
