import NumberInput from '../NumberInput'
import type { BuffCard, BuffStat, BuffStatType } from '../../lib/damage/types'

const STAT_OPTIONS: { value: BuffStatType; label: string }[] = [
  { value: 'attack', label: '攻撃力' },
  { value: 'defense', label: '防御力' },
  { value: 'hp', label: 'HP' },
  { value: 'critRate', label: '会心率' },
  { value: 'critDamage', label: '会心ダメージ' },
  { value: 'damageBuff', label: 'ダメージバフ' },
]

const SCALABLE_TYPES: BuffStatType[] = ['attack', 'defense', 'hp']

type Props = {
  card: BuffCard
  onChange: (next: BuffCard) => void
  onRemove: () => void
}

export default function BuffCardForm({ card, onChange, onRemove }: Props) {
  const updateStat = (index: number, patch: Partial<BuffStat>) => {
    onChange({
      ...card,
      stats: card.stats.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    })
  }
  const removeStat = (index: number) => {
    onChange({
      ...card,
      stats: card.stats.filter((_, i) => i !== index),
    })
  }
  const addStat = () => {
    onChange({
      ...card,
      stats: [...card.stats, { type: 'attack', value: 0, isPercentage: true }],
    })
  }

  return (
    <div className="border border-slate-800 rounded-lg p-3 space-y-2 bg-slate-900/50">
      <div className="flex items-center gap-2">
        <input
          className="input flex-1"
          value={card.name}
          onChange={(e) => onChange({ ...card, name: e.target.value })}
          placeholder="バフ名"
        />
        <button
          className="text-slate-500 hover:text-rose-400 text-sm px-2"
          onClick={onRemove}
          aria-label="バフを削除"
        >
          ✕
        </button>
      </div>
      <div className="space-y-1.5">
        {card.stats.map((stat, i) => {
          const scalable = SCALABLE_TYPES.includes(stat.type)
          return (
            <div key={i} className="flex items-center gap-2 flex-wrap">
              <select
                className="input w-32"
                value={stat.type}
                onChange={(e) =>
                  updateStat(i, { type: e.target.value as BuffStatType })
                }
              >
                {STAT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <div className="w-24">
                <NumberInput
                  value={stat.value}
                  step={0.1}
                  onChange={(v) => updateStat(i, { value: v })}
                />
              </div>
              <label
                className={`flex items-center gap-1 text-xs ${
                  scalable ? '' : 'opacity-40 cursor-not-allowed'
                }`}
              >
                <input
                  type="checkbox"
                  checked={scalable ? stat.isPercentage : false}
                  disabled={!scalable}
                  onChange={(e) =>
                    updateStat(i, { isPercentage: e.target.checked })
                  }
                  className="accent-sky-500"
                />
                <span>基礎値の%</span>
              </label>
              <button
                className="text-slate-500 hover:text-rose-400 text-sm ml-auto"
                onClick={() => removeStat(i)}
                aria-label="ステータス変化を削除"
              >
                ✕
              </button>
            </div>
          )
        })}
        <button className="btn text-xs" onClick={addStat}>
          ＋ ステータス変化を追加
        </button>
      </div>
    </div>
  )
}
