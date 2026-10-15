import { useMemo } from 'react'
import PageHeader from '../components/PageHeader'
import NumberInput from '../components/NumberInput'
import RunsLineChart from '../components/RunsLineChart'
import { useLocalStorage } from '../lib/useLocalStorage'
import { fmt } from '../lib/format'
import {
  TALENT_MAX,
  TALENT_MIN,
  talentCost,
  type TalentRarity,
} from '../lib/materials'
import {
  MAX_RUNS_LIMIT,
  talentSufficiencyByRuns,
} from '../lib/sufficiencyByRuns'

type Row = {
  id: string
  from: number
  to: number
  count: number
}

type State = {
  rows: Row[]
  owned: Record<TalentRarity, number>
  maxRuns: number
}

const INITIAL: State = {
  rows: [
    { id: 'a', from: 1, to: 10, count: 1 },
    { id: 'b', from: 10, to: 10, count: 0 },
    { id: 'c', from: 1, to: 1, count: 0 },
  ],
  owned: { 2: 14, 3: 33, 4: 22 },
  maxRuns: 10,
}

const RARITIES: TalentRarity[] = [4, 3, 2]
const STAR = (r: TalentRarity) => `★${r}`

const clampRuns = (v: number) =>
  Math.min(MAX_RUNS_LIMIT, Math.max(1, Math.floor(v)))

export default function Talent() {
  const [state, setState, reset] = useLocalStorage<State>('talent2-v1', INITIAL)

  const totals = useMemo(() => {
    const acc: Record<TalentRarity, number> = { 2: 0, 3: 0, 4: 0 }
    for (const row of state.rows) {
      const cost = talentCost(row.from, row.to, row.count)
      for (const r of RARITIES) acc[r] += cost[r]
    }
    return acc
  }, [state.rows])

  // 秘境IV を 0〜上限周した後の充足確率（index = 周回数）。
  const probabilities = useMemo(
    () => talentSufficiencyByRuns(state.owned, totals, clampRuns(state.maxRuns)),
    [state.owned, totals, state.maxRuns],
  )

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

  const setMaxRuns = (v: number) => {
    setState((s) => ({ ...s, maxRuns: clampRuns(v) }))
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
                          className="text-right stat text-neutral-300"
                        >
                          {fmt(cost[r])}
                        </td>
                      ))}
                      <td className="text-right">
                        <button
                          className="text-neutral-500 hover:text-rose-400 text-sm"
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
                  <td colSpan={3} className="text-right text-neutral-400">
                    所持
                  </td>
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
                      </div>
                    </td>
                  ))}
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-4">
          <label className="flex items-center gap-2">
            <span className="text-sm text-neutral-400">周回数上限</span>
            <NumberInput
              value={state.maxRuns}
              min={1}
              max={MAX_RUNS_LIMIT}
              onChange={setMaxRuns}
            />
          </label>
        </div>

        <div className="card p-4">
          <RunsLineChart series={[{ values: probabilities }]} />
        </div>
      </div>
    </div>
  )
}
