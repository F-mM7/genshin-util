import { useMemo } from 'react'
import PageHeader from '../components/PageHeader'
import NumberInput from '../components/NumberInput'
import { useLocalStorage } from '../lib/useLocalStorage'
import { fmt, signClass } from '../lib/format'

type Rarity = 5 | 4 | 3 | 2
const RARITIES: Rarity[] = [5, 4, 3, 2]
const STAR = (r: Rarity) => '★'.repeat(r)

type State = {
  required: Record<Rarity, number>
  owned: Record<Rarity, number>
  bedoLabel: string
  bedoCount: number
}

const INITIAL: State = {
  required: { 5: 6, 4: 14, 3: 14, 2: 5 },
  owned: { 5: 5, 4: 15, 3: 19, 2: 9 },
  bedoLabel: 'ベドさん（×2 繰上）',
  bedoCount: 1,
}

export default function Weapon() {
  const [state, setState, reset] = useLocalStorage<State>('weapon', INITIAL)

  // Excel:
  //   B4=QUOTIENT(MAX(0,C5),3)            通常: 上位の余り÷3
  //   B5=B3+B4-B2                          余り = 所持 + 繰上 - 必要
  //   B6=QUOTIENT(MAX(0,C7),3)*2           ベド: 上位の余り÷3 × 2
  //   B7=B3+B6-B2
  // E列(★2)は繰上の元がないため normal/bedo とも 0。
  const calc = useMemo(() => {
    const carryFor = (
      multiplier: number
    ): {
      gain: Record<Rarity, number>
      surplus: Record<Rarity, number>
    } => {
      const surplus: Record<Rarity, number> = { 5: 0, 4: 0, 3: 0, 2: 0 }
      const gain: Record<Rarity, number> = { 5: 0, 4: 0, 3: 0, 2: 0 }
      // 下位から計算する
      const reverse: Rarity[] = [2, 3, 4, 5]
      // まず ★2 は繰上元がないので gain=0
      surplus[2] = state.owned[2] - state.required[2]
      for (let i = 1; i < reverse.length; i++) {
        const cur = reverse[i]
        const below = reverse[i - 1]
        const belowSurplus = surplus[below]
        const g = Math.max(0, Math.floor(belowSurplus / 3)) * multiplier
        gain[cur] = g
        surplus[cur] = state.owned[cur] + g - state.required[cur]
      }
      return { gain, surplus }
    }

    const normal = carryFor(1)
    const bedo = carryFor(Math.max(0, state.bedoCount) * 2)
    return { normal, bedo }
  }, [state.owned, state.required, state.bedoCount])

  return (
    <div>
      <PageHeader
        title="武器突破素材"
        description="武器突破素材の必要数と所持数から余りを計算します。"
        actions={
          <button className="btn-danger" onClick={reset}>
            初期値に戻す
          </button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-4 lg:col-span-2">
          <h2 className="font-semibold mb-3">必要・所持</h2>
          <table className="table-mini">
            <thead>
              <tr>
                <th></th>
                {RARITIES.map((r) => (
                  <th key={r} className="text-right">
                    {STAR(r)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="text-slate-400">必要</td>
                {RARITIES.map((r) => (
                  <td key={r}>
                    <NumberInput
                      value={state.required[r]}
                      min={0}
                      onChange={(v) =>
                        setState((s) => ({
                          ...s,
                          required: { ...s.required, [r]: v },
                        }))
                      }
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="text-slate-400">所持</td>
                {RARITIES.map((r) => (
                  <td key={r}>
                    <NumberInput
                      value={state.owned[r]}
                      min={0}
                      onChange={(v) =>
                        setState((s) => ({
                          ...s,
                          owned: { ...s.owned, [r]: v },
                        }))
                      }
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="card p-4">
          <h2 className="font-semibold mb-3">ベドさん設定</h2>
          <div className="flex items-center gap-3 mb-3">
            <label className="label w-20 shrink-0" htmlFor="bedolabel">
              ラベル
            </label>
            <input
              id="bedolabel"
              className="input"
              value={state.bedoLabel}
              onChange={(e) =>
                setState((s) => ({ ...s, bedoLabel: e.target.value }))
              }
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="label w-20 shrink-0" htmlFor="bedocount">
              倍率(×2)
            </label>
            <NumberInput
              id="bedocount"
              value={state.bedoCount}
              min={0}
              onChange={(v) => setState((s) => ({ ...s, bedoCount: v }))}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            上位余り÷3 × 2 を「ベドさん」繰上獲得として計算します。
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mt-4">
        <Scenario
          title="通常（×1 繰上）"
          description="上位の余りを 3 個崩して下位 1 個に。"
          gain={calc.normal.gain}
          surplus={calc.normal.surplus}
        />
        <Scenario
          title={state.bedoLabel}
          description={`上位の余り÷3 × ${Math.max(0, state.bedoCount) * 2} で下位を増やす。`}
          gain={calc.bedo.gain}
          surplus={calc.bedo.surplus}
        />
      </div>
    </div>
  )
}

function Scenario({
  title,
  description,
  gain,
  surplus,
}: {
  title: string
  description: string
  gain: Record<Rarity, number>
  surplus: Record<Rarity, number>
}) {
  return (
    <div className="card p-4">
      <div className="font-medium">{title}</div>
      <div className="text-xs text-slate-500 mt-0.5 mb-3">{description}</div>
      <table className="table-mini">
        <thead>
          <tr>
            <th></th>
            {RARITIES.map((r) => (
              <th key={r} className="text-right">
                {STAR(r)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="text-slate-400">繰上獲得</td>
            {RARITIES.map((r) => (
              <td key={r} className="text-right stat text-slate-300">
                {fmt(gain[r])}
              </td>
            ))}
          </tr>
          <tr>
            <td className="text-slate-400">余り</td>
            {RARITIES.map((r) => (
              <td
                key={r}
                className={`text-right stat ${signClass(surplus[r])}`}
              >
                {fmt(surplus[r])}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
