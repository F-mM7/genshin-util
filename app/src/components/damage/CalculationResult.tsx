import { applyBuffs } from '../../lib/damage/calc'
import { fmt } from '../../lib/format'
import type {
  BuffCard,
  CalculationResult as CalcResult,
  StatType,
  Stats,
  TradeoffMatrixCell,
} from '../../lib/damage/types'

type AxisKey = StatType | 'critRate' | 'critDamage'

const STAT_AXIS_LABEL: Record<AxisKey, string> = {
  attack: '攻撃力%',
  defense: '防御力%',
  hp: 'HP%',
  critRate: '会心率',
  critDamage: '会心ダメージ',
}

const STAT_TYPE_LABEL: Record<StatType, string> = {
  attack: '攻撃力',
  defense: '防御力',
  hp: 'HP',
}

type Props = {
  result: CalcResult
  stats: Stats
  buffs: BuffCard[]
  statType: StatType
}

export default function CalculationResult({
  result,
  stats,
  buffs,
  statType,
}: Props) {
  const total = applyBuffs(stats, buffs)
  const axes: AxisKey[] = [statType, 'critRate', 'critDamage']

  return (
    <div className="space-y-4">
      <div className="card p-4 space-y-1">
        <div className="text-sm text-slate-400">
          評価値 ({STAT_TYPE_LABEL[statType]} 基準)
        </div>
        <div className="text-3xl stat">{fmt(result.evaluationValue, 1)}</div>
      </div>

      <div className="card p-4">
        <h2 className="font-semibold mb-2">適用後ステータス</h2>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <StatRow label="攻撃力" value={fmt(total.attack, 1)} active={statType === 'attack'} />
          <StatRow label="防御力" value={fmt(total.defense, 1)} active={statType === 'defense'} />
          <StatRow label="HP" value={fmt(total.hp, 1)} active={statType === 'hp'} />
          <StatRow label="会心率" value={`${fmt(total.critRate, 1)}%`} />
          <StatRow label="会心ダメージ" value={`${fmt(total.critDamage, 1)}%`} />
          <StatRow label="ダメージバフ" value={`${fmt(total.damageBuff, 1)}%`} />
        </dl>
      </div>

      <div className="card p-4 space-y-3">
        <h2 className="font-semibold">サブステ 1 単位の交換</h2>
        <div className="overflow-x-auto">
          <table className="table-mini">
            <thead>
              <tr>
                <th className="text-left">+↑ / −↓</th>
                {axes.map((a) => (
                  <th key={a} className="text-right">
                    {STAT_AXIS_LABEL[a]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {axes.map((row, i) => (
                <tr key={row}>
                  <td className="text-slate-400">{STAT_AXIS_LABEL[row]}</td>
                  {axes.map((col, j) => (
                    <MatrixCell
                      key={col}
                      cell={result.balance.tradeoffMatrix[i][j]}
                      sameAxis={i === j}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-4 space-y-2">
        <h2 className="font-semibold">メインステータス（杯）の比較</h2>
        <div className="overflow-x-auto">
          <table className="table-mini">
            <thead>
              <tr>
                <th>変更</th>
                <th className="text-right">変化量</th>
                <th className="text-right">変化後評価値</th>
              </tr>
            </thead>
            <tbody>
              {result.mainStatTradeoffs.map((m) => (
                <tr key={m.name}>
                  <td>{m.name}</td>
                  <td
                    className={`text-right stat ${
                      m.improvement > 0 ? 'stat-pos' : 'stat-neg'
                    }`}
                  >
                    {m.improvement > 0 ? '+' : ''}
                    {fmt(m.improvement, 1)}
                  </td>
                  <td className="text-right stat">{fmt(m.newValue, 1)}</td>
                </tr>
              ))}
              {result.mainStatTradeoffs.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="text-center text-slate-500 text-xs py-2"
                  >
                    対応する杯トレードオフがありません
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatRow({
  label,
  value,
  active,
}: {
  label: string
  value: string
  active?: boolean
}) {
  return (
    <>
      <dt className={`label ${active ? 'text-sky-300' : ''}`}>{label}</dt>
      <dd className={`stat text-right ${active ? 'text-sky-100' : ''}`}>
        {value}
      </dd>
    </>
  )
}

function MatrixCell({
  cell,
  sameAxis,
}: {
  cell: TradeoffMatrixCell
  sameAxis: boolean
}) {
  if (sameAxis) {
    return <td className="text-center text-slate-700">—</td>
  }
  if (!cell) {
    return <td className="text-center text-slate-700">-</td>
  }
  return (
    <td
      className={`text-right stat ${
        cell.beneficial ? 'stat-pos' : 'stat-neg'
      }`}
    >
      {cell.improvement > 0 ? '+' : ''}
      {fmt(cell.improvement, 1)}
    </td>
  )
}
