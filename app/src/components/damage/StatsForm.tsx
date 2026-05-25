import NumberInput from '../NumberInput'
import type { StatType, Stats } from '../../lib/damage/types'

type Field = {
  key: keyof Stats
  label: string
  step?: number
  group?: StatType
}

const FIELDS: Field[] = [
  { key: 'baseAttack', label: '基礎攻撃力', group: 'attack' },
  { key: 'attack', label: '攻撃力', group: 'attack' },
  { key: 'baseDefense', label: '基礎防御力', group: 'defense' },
  { key: 'defense', label: '防御力', group: 'defense' },
  { key: 'baseHp', label: '基礎HP', group: 'hp' },
  { key: 'hp', label: 'HP', group: 'hp' },
  { key: 'critRate', label: '会心率(%)', step: 0.1 },
  { key: 'critDamage', label: '会心ダメージ(%)', step: 0.1 },
  { key: 'damageBuff', label: 'ダメージバフ(%)', step: 0.1 },
]

type Props = {
  stats: Stats
  onChange: (next: Stats) => void
  statType: StatType
}

export default function StatsForm({ stats, onChange, statType }: Props) {
  return (
    <div className="grid gap-x-3 gap-y-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {FIELDS.map((f) => {
        const highlighted = f.group === statType
        return (
          <div key={f.key} className="flex items-center gap-2">
            <label
              htmlFor={`stat-${f.key}`}
              className={`label w-24 shrink-0 ${
                highlighted ? 'text-sky-300' : ''
              }`}
            >
              {f.label}
            </label>
            <div className="flex-1 min-w-0">
              <NumberInput
                id={`stat-${f.key}`}
                value={stats[f.key]}
                step={f.step}
                onChange={(v) => onChange({ ...stats, [f.key]: v })}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
